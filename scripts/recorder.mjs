import { mkdirSync, writeFileSync } from 'node:fs'
import { sleep } from './browser-bidi.mjs'

export function startRecorder(browser, frameDir) {
  mkdirSync(frameDir, { recursive: true })
  const start = Date.now()
  const frames = []
  const chapters = []
  let running = true
  let failure = null
  const capture = (async () => {
    while (running) {
      const path = `${frameDir}/frame-${String(frames.length).padStart(5, '0')}.png`
      try {
        await browser.screenshot(path)
        frames.push({ path, time: Date.now() - start })
      } catch (error) {
        failure = error
        break
      }
      await sleep(220)
    }
  })()
  return {
    async step(label, action, hold = 900) {
      chapters.push({ label, time: Date.now() - start })
      console.log(`${Math.round((Date.now() - start) / 1000)}s ${label}`)
      if (action) await action()
      await sleep(hold)
    },
    async stop() {
      running = false
      await capture
      if (failure) throw failure
      const manifest = { start, frames, chapters }
      writeFileSync(`${frameDir}/manifest.json`, JSON.stringify(manifest, null, 2))
      const lines = []
      for (let i = 0; i < frames.length; i++) {
        lines.push(`file '${frames[i].path}'`)
        const next = frames[i + 1]?.time ?? Date.now() - start
        lines.push(`duration ${Math.max(0.06, (next - frames[i].time) / 1000).toFixed(3)}`)
      }
      if (frames.length) lines.push(`file '${frames.at(-1).path}'`)
      writeFileSync(`${frameDir}/frames.txt`, lines.join('\n') + '\n')
      writeFileSync(`${frameDir}/chapters.md`, chapters.map(({ label, time }) =>
        `- ${Math.floor(time / 60000)}:${String(Math.floor(time / 1000) % 60).padStart(2, '0')} ${label}`
      ).join('\n') + '\n')
      return manifest
    },
  }
}
