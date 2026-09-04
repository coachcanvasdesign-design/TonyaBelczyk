import puppeteer from 'puppeteer'
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const dir = join(__dirname, 'temporary screenshots')
if (!existsSync(dir)) mkdirSync(dir)

const url   = process.argv[2] || 'http://localhost:3000'
const label = process.argv[3] ? `-${process.argv[3]}` : ''

const existing = readdirSync(dir).filter(f => f.endsWith('.png'))
const n = existing.length + 1
const outPath = join(dir, `screenshot-${n}${label}.png`)

const browser = await puppeteer.launch({ headless: 'new' })
const page    = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })
await page.goto(url, { waitUntil: 'networkidle2' })

// Force all scroll-reveal elements instantly visible (bypass transitions)
await page.evaluate(() => {
  const style = document.createElement('style')
  style.textContent = '.reveal { transition: none !important; transition-delay: 0s !important; }'
  document.head.appendChild(style)
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'))
})
await new Promise(r => setTimeout(r, 200))

await page.screenshot({ path: outPath, fullPage: true })
await browser.close()

console.log(outPath)
