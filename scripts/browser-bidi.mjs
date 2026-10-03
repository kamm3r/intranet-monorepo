import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function browser({ profile = '/tmp/intranet-flow-firefox', port = 9227 } = {}) {
  mkdirSync(profile, { recursive: true })
  const process = spawn('firefox', [
    '--headless', '--no-remote', '--profile', profile,
    '--remote-debugging-port', String(port), 'about:blank',
  ], { stdio: 'ignore' })
  let socket
  for (let i = 0; i < 80; i++) {
    try {
      socket = new WebSocket(`ws://127.0.0.1:${port}/session`)
      await new Promise((resolve, reject) => {
        socket.addEventListener('open', resolve, { once: true })
        socket.addEventListener('error', reject, { once: true })
      })
      break
    } catch { await sleep(100) }
  }
  if (!socket || socket.readyState !== WebSocket.OPEN) throw new Error('Firefox BiDi did not start')

  let sequence = 0
  const pending = new Map()
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)
    const waiter = pending.get(message.id)
    if (!waiter) return
    pending.delete(message.id)
    if (message.type === 'error') waiter.reject(new Error(message.message))
    else waiter.resolve(message.result)
  })
  const call = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence
    pending.set(id, { resolve, reject })
    socket.send(JSON.stringify({ id, method, params }))
  })
  await call('session.new', { capabilities: { alwaysMatch: { browserName: 'firefox' } } })
  const context = (await call('browsingContext.getTree')).contexts[0].context
  await call('browsingContext.setViewport', { context, viewport: { width: 1440, height: 900 } })

  const evaluate = async (expression) => {
    const result = await call('script.evaluate', {
      expression, target: { context }, awaitPromise: true, resultOwnership: 'none',
    })
    if (result.type === 'exception') throw new Error(result.exceptionDetails.text)
    return result.result?.value
  }
  const json = async (expression) => {
    const value = await evaluate(`JSON.stringify(${expression})`)
    return value === undefined ? null : JSON.parse(value)
  }
  const screenshot = async (path) => {
    mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true })
    const result = await call('browsingContext.captureScreenshot', { context })
    writeFileSync(path, Buffer.from(result.data, 'base64'))
  }
  const pointerClick = async (selector) => {
    const rect = await json(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)})
      if (!element) return null
      element.scrollIntoView({ block: 'center' })
      const box = element.getBoundingClientRect()
      return { x: Math.round(box.left + box.width / 2), y: Math.round(box.top + box.height / 2) }
    })()`)
    if (!rect) throw new Error(`Missing element: ${selector}`)
    await call('input.performActions', { context, actions: [{
      type: 'pointer', id: 'mouse', parameters: { pointerType: 'mouse' }, actions: [
        { type: 'pointerMove', x: rect.x, y: rect.y, origin: 'viewport', duration: 0 },
        { type: 'pointerDown', button: 0 }, { type: 'pointerUp', button: 0 },
      ],
    }] })
    await sleep(300)
  }
  const click = async (selector) => {
    const found = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)})
      if (!element) return false
      element.click()
      return true
    })()`)
    if (!found) throw new Error(`Missing element: ${selector}`)
    await sleep(300)
  }
  const fill = async (selector, value) => {
    const found = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)})
      if (!element) return false
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(element, ${JSON.stringify(value)})
      element.dispatchEvent(new Event('input', { bubbles: true }))
      element.dispatchEvent(new Event('change', { bubbles: true }))
      return true
    })()`)
    if (!found) throw new Error(`Missing input: ${selector}`)
    await sleep(120)
  }
  const navigate = async (url) => {
    await call('browsingContext.navigate', { context, url, wait: 'complete' })
    await sleep(650)
  }
  const close = async () => {
    try { await call('session.end') } finally { socket.close(); process.kill() }
  }
  return { call, context, evaluate, json, screenshot, pointerClick, click, fill, navigate, close }
}
