import { readFileSync, mkdirSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { browser, sleep } from './browser-bidi.mjs'
import { startRecorder } from './recorder.mjs'

const base = 'http://localhost'
const users = `${base}:5171`
const portal = `${base}:5172`
const kuutio = `${base}:5175`
const tyoaika = `${base}:5176`
const credentials = JSON.parse(readFileSync(process.env.INTRANET_DEMO_CREDENTIALS || '/tmp/intranet-demo-credentials.json', 'utf8'))
const suffix = randomBytes(4).toString('hex')
const memberEmail = `tour-${suffix}@example.test`
const memberPassword = `Tour-${randomBytes(10).toString('hex')}`
const newMemberPassword = `Reset-${randomBytes(10).toString('hex')}`
const serviceName = `tour-service-${suffix}`
const profile = `/tmp/intranet-flow-${suffix}-firefox`
const framesPath = `/tmp/intranet-flow-${suffix}-frames`
const b = await browser({ profile })
let recorder

const tag = async (selector, exactText) => {
  const found = await b.evaluate(`(() => {
    document.querySelectorAll('[data-flow-target]').forEach((element) => element.removeAttribute('data-flow-target'))
    const element = [...document.querySelectorAll(${JSON.stringify(selector)})]
      .find((candidate) => candidate.textContent.trim() === ${JSON.stringify(exactText)} && !candidate.disabled)
    if (!element) return false
    element.setAttribute('data-flow-target', '')
    return true
  })()`)
  if (!found) throw new Error(`Missing ${selector} with text ${exactText}`)
  return '[data-flow-target]'
}
const press = async (selector, text) => b.pointerClick(await tag(selector, text))
const waitFor = async (expression, timeout = 9000) => {
  for (let i = 0; i < timeout / 250; i++) {
    try { if (await b.evaluate(expression)) return } catch { /* Navigation in progress. */ }
    await sleep(250)
  }
  throw new Error(`Timed out waiting for ${expression}`)
}
const selectNative = async (selector, value) => {
  const found = await b.evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)})
    if (!element) return false
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set
    setter.call(element, ${JSON.stringify(value)})
    element.dispatchEvent(new Event('change', { bubbles: true }))
    return true
  })()`)
  if (!found) throw new Error(`Missing select: ${selector}`)
}
const day = async (offset = 0) => b.evaluate(`(() => {
  const date = new Date()
  date.setDate(date.getDate() + ${offset})
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
})()`)
const localDay = async (offset = 0) => b.evaluate(`(() => {
  const date = new Date()
  date.setDate(date.getDate() + ${offset})
  return date.toLocaleDateString()
})()`)
const serviceRow = async (name) => {
  const found = await b.evaluate(`(() => {
    document.querySelectorAll('[data-flow-row]').forEach((element) => element.removeAttribute('data-flow-row'))
    const element = [...document.querySelectorAll('table tbody tr')]
      .find((row) => row.textContent.includes(${JSON.stringify(name)}))
    if (!element) return false
    element.setAttribute('data-flow-row', '')
    return true
  })()`)
  if (!found) throw new Error(`Missing row for ${name}`)
  return '[data-flow-row]'
}
const kuutioBooking = async () => {
  const found = await b.evaluate(`(() => {
    document.querySelectorAll('[data-flow-booking]').forEach((element) => element.removeAttribute('data-flow-booking'))
    const element = [...document.querySelectorAll('section .space-y-3 > div')].find((item) =>
      item.textContent.includes('Sisäinen palaveri') &&
      item.textContent.includes('Demo User') &&
      item.querySelector('button')?.textContent.includes('Poista varaus'))
    if (!element) return false
    element.setAttribute('data-flow-booking', '')
    return true
  })()`)
  if (!found) throw new Error('Missing recurring booking card')
  return '[data-flow-booking] button'
}
const go = (url) => b.navigate(url)
const setSlider = async (selector, value) => {
  const point = await b.json(`(() => { const box = document.querySelector(${JSON.stringify(selector)})?.getBoundingClientRect(); return box && { x: Math.round(box.left + box.width * ${value} / 100), y: Math.round(box.top + box.height / 2) } })()`)
  if (!point) throw new Error(`Missing slider: ${selector}`)
  await b.call('input.performActions', { context: b.context, actions: [{ type: 'pointer', id: 'slider', parameters: { pointerType: 'mouse' }, actions: [
    { type: 'pointerMove', x: point.x, y: point.y, origin: 'viewport', duration: 0 },
    { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 },
  ] }] })
}

try {
  await go(portal)
  recorder = startRecorder(b, framesPath)
  const step = recorder.step

  await step('Portal: guest dashboard and sign-in link', null, 1400)
  await step('Users: sign-in page', async () => {
    await press('main a', 'Kirjaudu')
    await waitFor('location.port === "5171"')
  })
  await step('Users: registration page and validation', async () => {
    await press('main a', 'Luo tunnus')
    await b.fill('#email', memberEmail)
    await b.fill('#password', 'short')
    await b.fill('#confirm', 'short')
    await b.pointerClick('form button[type=submit]')
  })
  await step('Users: create a member account', async () => {
    await b.fill('#password', memberPassword)
    await b.fill('#confirm', memberPassword)
    await b.pointerClick('form button[type=submit]')
    await waitFor('location.port === "5172" && document.body.innerText.includes("Yhteenveto")')
  })
  await step('Portal: member account and logout', async () => {
    await press('main a', 'Kirjaudu ulos')
    await waitFor('document.body.innerText.includes("Kirjaudu sisään nähdäksesi")')
  })
  await step('Users: member access restriction', async () => go(`${users}/users`))
  await step('Users: account hub session after portal logout', async () => {
    if (await b.evaluate('!!document.querySelector("header button:has(.lucide-chevron-down)")')) {
      await b.pointerClick('header button:has(.lucide-chevron-down)')
      await press('[role=menuitem]', 'Kirjaudu ulos')
    }
  })
  await step('Users: request a password reset', async () => {
    await go(`${users}/resetpassword`)
    await b.fill('#reset-email', memberEmail)
    await b.pointerClick('form button[type=submit]')
    await waitFor('!!document.querySelector("main a[href*=reset]")')
  })
  await step('Users: update the password through the development reset link', async () => {
    await b.pointerClick('main a[href*=reset]')
    await waitFor('!!document.querySelector("input[name=password]")')
    await b.fill('input[name=password]', newMemberPassword)
    await b.pointerClick('button[type=submit]')
    await waitFor('document.body.innerText.includes("password has been updated")')
  })
  await step('Users: admin sign-in', async () => {
    await go(`${users}/`)
    await b.fill('#email', credentials.email)
    await b.fill('#password', credentials.password)
    await b.pointerClick('form button[type=submit]')
    await waitFor('location.port === "5172" && document.body.innerText.includes("Yhteenveto")')
  })

  await step('Portal: two-row dashboard', null, 1400)
  await step('Portal: collapse and expand the desktop sidebar', async () => {
    await b.pointerClick('button[aria-label="Avaa tai sulje sivuvalikko"]')
    await sleep(500)
    await b.pointerClick('button[aria-label="Avaa tai sulje sivuvalikko"]')
  })
  await step('Portal: clock in', async () => press('button', 'Leimaa sisään'))
  await step('Portal: live hours and clock out', async () => press('button', 'Leimaa ulos'))
  await step('Portal: edit skills radar chart', async () => {
    await press('button', 'Muokkaa')
    await setSlider('[id="TypeScript"]', 85)
    await setSlider('[id="Algoritmit"]', 65)
    await setSlider('[id="UI/UX"]', 72)
    await press('[role=dialog] button', 'Tallenna')
  }, 1400)
  await step('Portal: select a date in the calendar', async () => {
    const date = await localDay(1)
    await b.pointerClick(`.dashboard-card--calendar button[data-day="${date}"]`)
  })
  await step('Portal: reserve a Kuutio meeting', async () => {
    await press('button', 'Varaa aika')
    await b.fill('#booking-topic', `Portal meeting ${suffix}`)
    const date = await localDay(1)
    await b.pointerClick(`[role=dialog] button[data-day="${date}"]`)
    await b.pointerClick('[role=dialog] .grid > div:nth-child(1) [role=combobox]')
    await press('[role=option]', '1 tunti')
    await b.pointerClick('[role=dialog] .grid > div:nth-child(2) [role=combobox]')
    await b.pointerClick('[role=option]:first-child')
    await press('[role=dialog] button', 'Varaa aika')
    await waitFor('!document.querySelector("[role=dialog]")')
  }, 1400)

  await step('Users: service directory', async () => go(`${users}/services`))
  await step('Users: switch light and dark appearance', async () => {
    await b.pointerClick('header button[aria-label="Vaihda teemaa"]')
    await press('[role=menuitem]', 'Vaalea')
    await sleep(350)
    await b.pointerClick('header button[aria-label="Vaihda teemaa"]')
    await press('[role=menuitem]', 'Tumma')
  })
  await step('Users: create a temporary service', async () => {
    await press('button', 'Lisää palvelu')
    await b.fill('#name', serviceName)
    await b.fill('#domain', 'localhost:5999')
    await press('button', 'Luo uusi avain')
    await b.pointerClick('button[aria-label="Näytä avain"]')
    await b.pointerClick('button[aria-label="Piilota avain"]')
    await b.pointerClick('#r1')
    await b.pointerClick('form button[type=submit]')
    await waitFor(`document.body.innerText.includes(${JSON.stringify(serviceName)})`)
  })
  await step('Users: reveal, copy, and hide a service key', async () => {
    await serviceRow(serviceName)
    await b.pointerClick('[data-flow-row] td:nth-child(5) button')
    await b.pointerClick('[data-flow-row] td:nth-child(4) button')
    await sleep(350)
    await b.pointerClick('[data-flow-row] td:nth-child(5) button')
  })
  await step('Users: edit the temporary service', async () => {
    await serviceRow(serviceName)
    await b.pointerClick('[data-flow-row] [aria-haspopup=menu]')
    await press('[role=menuitem]', 'muokkaa')
    await b.fill('#domain', 'localhost:5998')
    await b.pointerClick('form button[type=submit]')
    await waitFor('document.body.innerText.includes("localhost:5998")')
  })
  await step('Users: delete the temporary service', async () => {
    await serviceRow(serviceName)
    await b.pointerClick('[data-flow-row] [aria-haspopup=menu]')
    await press('[role=menuitem]', 'poista')
    await press('[role=alertdialog] button', 'Poista')
    await waitFor(`!document.body.innerText.includes(${JSON.stringify(serviceName)})`)
  })
  await step('Users: user access management', async () => go(`${users}/users`))
  await step('Users: edit member service access', async () => {
    await serviceRow(memberEmail)
    await b.pointerClick('[data-flow-row] [aria-haspopup=menu]')
    await press('[role=menuitem]', 'Määritä')
    await b.pointerClick('[role=dialog] button:has(.lucide-plus)')
    await b.pointerClick('[role=dialog] li:last-child > button')
    await waitFor('document.querySelectorAll("[role=dialog] li").length === 3')
    await b.pointerClick('[role=dialog] #level-1')
    await press('[role=option]', 'Sisällön muokkaaja')
    await press('[role=dialog] button', 'Tallenna')
    await waitFor('!document.querySelector("[role=dialog]")')
  })
  await step('Users: promote and revoke member admin access', async () => {
    await serviceRow(memberEmail)
    await b.pointerClick('[data-flow-row] [aria-haspopup=menu]')
    await press('[role=menuitem]', 'Anna oikeudet')
    await sleep(450)
    await serviceRow(memberEmail)
    await b.pointerClick('[data-flow-row] [aria-haspopup=menu]')
    await press('[role=menuitem]', 'Poista oikeudet')
  })

  await step('Kuutio: booking calendar and SSO', async () => {
    await go(kuutio)
    await press('a', 'Kirjaudu')
    await waitFor('location.port === "5175" && document.body.innerText.includes("Kirjaudu ulos")')
  }, 1500)
  await step('Kuutio: next month, previous month, and today', async () => {
    await b.pointerClick('button[aria-label="Seuraava kuukausi"]')
    await b.pointerClick('button[aria-label="Edellinen kuukausi"]')
    await press('button', 'Tänään')
  })
  await step('Kuutio: select tomorrow and an available slot', async () => {
    await b.pointerClick(`button[data-date="${await day(1)}"]`)
    const slots = await b.json(`[...document.querySelectorAll('button[aria-pressed]')]
      .filter((element) => !element.disabled && /^\\d{2}:\\d{2}$/.test(element.textContent.trim()))
      .map((element) => element.textContent.trim())`)
    if (slots.length < 2) throw new Error('No adjacent Kuutio slots tomorrow')
    await press('button[aria-pressed]', slots[0])
    await press('button[aria-pressed]', slots[1])
    await b.fill('#booking-name', 'Demo User')
    await selectNative('select', 'Sisäinen palaveri')
  })
  await step('Kuutio: recurring reservation options', async () => {
    await b.pointerClick('#regular-booking-checkbox')
    await b.pointerClick('#regular-time-weekdays')
    await b.pointerClick('#regular-time-weekly')
    await b.fill('#regular-len', '2')
  })
  await step('Kuutio: confirm two weekly bookings', async () => {
    await press('button', 'Varaa Kuutio')
    await press('button', 'Peruuta')
    await press('button', 'Varaa Kuutio')
    await press('button', 'Vahvista varaus')
    await waitFor('document.body.innerText.includes("Varaus vahvistettu")')
  }, 1300)
  await step('Kuutio: return to the booking list', async () => press('button', 'Valmis'))
  await step('Kuutio: view booking statistics', async () => press('button', 'Näytä tilastot'), 1300)
  await step('Kuutio: hide statistics and delete a booking', async () => {
    await press('button', 'Piilota tilastot')
    await b.pointerClick(await kuutioBooking())
    await press('[role=alertdialog] button', 'Poista varaus')
  })
  await step('Kuutio: next week and calendar navigation', async () => {
    await b.pointerClick(`button[data-date="${await day(8)}"]`)
  })
  await step('Kuutio: delete the remaining recurring booking', async () => {
    await b.pointerClick(await kuutioBooking())
    await press('[role=alertdialog] button', 'Poista varaus')
  })
  await step('Kuutio: sign out and sign back in', async () => {
    await press('a', 'Kirjaudu ulos')
    await waitFor('[...document.querySelectorAll("a")].some((item) => item.textContent.trim() === "Kirjaudu")')
    await press('a', 'Kirjaudu')
    await waitFor('location.port === "5171" || (location.port === "5175" && document.body.innerText.includes("Kirjaudu ulos"))')
    if (await b.evaluate('location.port === "5171"')) {
      await waitFor('!!document.querySelector("#email")')
      await b.fill('#email', credentials.email)
      await b.fill('#password', credentials.password)
      await b.pointerClick('form button[type=submit]')
    }
    await waitFor('location.port === "5175" && document.body.innerText.includes("Kirjaudu ulos")')
  })
  await step('Kuutio: return to portal', async () => press('a', 'Palaa etusivulle'))

  await step('Työaika: SSO and home page', async () => {
    await go(tyoaika)
    if (await b.evaluate('document.body.innerText.includes("Kirjaudu sisään työaikakirjaukseen")')) {
      await press('a', 'Kirjaudu sisään')
      await waitFor('location.port === "5176" && document.body.innerText.includes("Sisään")')
    }
  }, 1200)
  await step('Työaika: clock in and confirmation', async () => press('button', 'Sisään'))
  await step('Työaika: close the confirmation', async () => press('[role=dialog] button', 'Sulje'))
  await step('Työaika: clock out and confirmation', async () => press('button', 'Ulos'))
  await step('Työaika: close the confirmation', async () => press('[role=dialog] button', 'Sulje'))
  await step('Työaika: employee roster', async () => go(`${tyoaika}/employees`))
  await step('Työaika: employee month view', async () => {
    await b.pointerClick('a[href*="tour-"]')
  })
  await step('Työaika: next month', async () => b.pointerClick('button[aria-label="Seuraava kuukausi"]'))
  await step('Työaika: previous month', async () => b.pointerClick('button[aria-label="Edellinen kuukausi"]'))
  await step('Työaika: own completed worktimes', async () => go(`${tyoaika}/work-schedule`))
  await step('Työaika: sign out', async () => press('button', 'Kirjaudu ulos'))

  await step('Users: admin signs in to remove the temporary member', async () => {
    await go(`${users}/`)
    await b.fill('#email', credentials.email)
    await b.fill('#password', credentials.password)
    await b.pointerClick('form button[type=submit]')
    await waitFor('location.port === "5172" && document.body.innerText.includes("Yhteenveto")')
    await go(`${users}/users`)
  })
  await step('Users: remove the temporary member account', async () => {
    await serviceRow(memberEmail)
    await b.pointerClick('[data-flow-row] [aria-haspopup=menu]')
    await press('[role=menuitem]', 'Poista käyttäjä')
    await press('[role=alertdialog] button', 'Poista')
    await waitFor(`!document.body.innerText.includes(${JSON.stringify(memberEmail)})`)
  })
  await step('Portal: final dashboard', async () => go(portal), 1800)
} catch (error) {
  console.error('Recording stopped:', error.message)
  process.exitCode = 1
} finally {
  if (recorder) {
    try {
      const manifest = await recorder.stop()
      console.log(`Frames: ${manifest.frames.length}; chapters: ${manifest.chapters.length}`)
      console.log(`Frame directory: ${framesPath}`)
    } catch (error) { console.error('Capture failed:', error.message); process.exitCode = 1 }
  }
  await b.close()
  console.log(`Temporary member: ${memberEmail}`)
}
