import { createServer } from 'node:http'
import { stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const PORT = 3000

const mime = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.ogg':  'video/ogg',
}

createServer(async (req, res) => {
  const pathname = req.url.split('?')[0]
  const url      = pathname === '/' ? '/index.html' : pathname
  const filePath = join(__dirname, url)

  try {
    const info        = await stat(filePath)
    const contentType = mime[extname(url).toLowerCase()] || 'application/octet-stream'
    const fileSize    = info.size
    const range       = req.headers.range

    if (range) {
      // Partial content — required for video seeking
      const [rawStart, rawEnd] = range.replace(/bytes=/, '').split('-')
      const start = parseInt(rawStart, 10)
      const end   = rawEnd ? parseInt(rawEnd, 10) : fileSize - 1
      const chunk = end - start + 1

      res.writeHead(206, {
        'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunk,
        'Content-Type':   contentType,
      })
      createReadStream(filePath, { start, end }).pipe(res)
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Accept-Ranges':  'bytes',
        'Content-Type':   contentType,
      })
      createReadStream(filePath).pipe(res)
    }
  } catch {
    res.writeHead(404)
    res.end('Not found')
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`))
