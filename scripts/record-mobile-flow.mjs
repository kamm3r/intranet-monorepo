import { browser, sleep } from './browser-bidi.mjs'
import { startRecorder } from './recorder.mjs'

const profile = process.env.INTRANET_RECORD_PROFILE
if (!profile) throw new Error('Set INTRANET_RECORD_PROFILE to the authenticated recording profile')
const framesPath = process.env.INTRANET_MOBILE_FRAMES || '/tmp/intranet-mobile-flow-frames'
const b = await browser({ profile, port: 9228 })
await b.call('browsingContext.setViewport', { context: b.context, viewport: { width: 390, height: 844 } })
const checkWidth = async (page) => {
  const widths = await b.json('({content:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth})')
  console.log(`${page}: ${widths.content}/${widths.viewport}px`)
  if (widths.content > widths.viewport) throw new Error(`${page} overflows horizontally`)
}
let recorder
try {
  await b.navigate('http://localhost:5172/')
  recorder = startRecorder(b, framesPath)
  const step = recorder.step
  await step('Portal: responsive dashboard', async () => checkWidth('Portal'), 1500)
  await step('Portal: mobile sidebar', async () => {
    await b.pointerClick('button[aria-label="Avaa tai sulje sivuvalikko"]')
  }, 1700)
  await step('Portal: calendar and skills card', async () => {
    await b.navigate('http://localhost:5172/')
    await b.evaluate('document.querySelector(".dashboard-card--skills")?.scrollIntoView({block:"center"})')
  }, 1500)

  await step('Users: responsive service directory', async () => {
    await b.navigate('http://localhost:5171/services')
    await checkWidth('Users services')
  }, 1500)
  await step('Users: mobile navigation menu', async () => {
    await b.pointerClick('button[aria-label="Avaa valikko"]')
  }, 1500)
  await step('Users: responsive user management', async () => {
    await b.navigate('http://localhost:5171/users')
    await checkWidth('Users management')
  }, 1500)

  await step('Kuutio: responsive booking calendar', async () => {
    await b.navigate('http://localhost:5175/')
    await checkWidth('Kuutio')
  }, 1600)
  await step('Kuutio: select the next day', async () => {
    const tomorrow = await b.evaluate('(() => {const d=new Date();d.setDate(d.getDate()+1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-")})()')
    await b.pointerClick(`button[data-date="${tomorrow}"]`)
  }, 1500)

  await step('Työaika: responsive clock page', async () => {
    await b.navigate('http://localhost:5176/')
    if (await b.evaluate('document.body.innerText.includes("Kirjaudu sisään työaikakirjaukseen")')) {
      await b.pointerClick('main a')
      for (let i = 0; i < 30; i++) {
        if (await b.evaluate('location.port === "5176" && document.body.innerText.includes("Sisään")')) break
        await sleep(250)
      }
    }
    await checkWidth('Työaika')
  }, 1700)
  await step('Työaika: mobile navigation and employee roster', async () => {
    await b.pointerClick('button[aria-label="Valikko"]')
  }, 1200)
  await step('Työaika: responsive employee roster', async () => {
    await b.navigate('http://localhost:5176/employees')
    await checkWidth('Työaika employees')
  }, 1500)
  await step('Työaika: responsive monthly schedule', async () => {
    await b.navigate('http://localhost:5176/work-schedule')
    await checkWidth('Työaika schedule')
  }, 1800)
} catch (error) {
  console.error('Mobile recording stopped:', error.message)
  process.exitCode = 1
} finally {
  if (recorder) {
    const manifest = await recorder.stop()
    console.log(`Frames: ${manifest.frames.length}; chapters: ${manifest.chapters.length}`)
    console.log(`Frame directory: ${framesPath}`)
  }
  await b.close()
}
