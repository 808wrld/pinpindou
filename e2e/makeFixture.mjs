import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { deflateSync } from 'node:zlib'

const outDir = resolve('e2e/fixtures')
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

// Build a 64x64 RGB gradient PNG manually.
const W = 64,
  H = 64

function crc32(buf) {
  let c,
    table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff >>> 0
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8 // bit depth
ihdr[9] = 2 // color type: RGB
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

// raw scanlines: filter byte + RGB
const raw = Buffer.alloc(H * (1 + W * 3))
for (let y = 0; y < H; y++) {
  raw[y * (1 + W * 3)] = 0 // filter: none
  for (let x = 0; x < W; x++) {
    const i = y * (1 + W * 3) + 1 + x * 3
    raw[i] = Math.floor((x / W) * 255)
    raw[i + 1] = Math.floor((y / H) * 255)
    raw[i + 2] = 128
  }
}
const idat = deflateSync(raw)

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
])

writeFileSync(resolve(outDir, 'sample.png'), png)
console.log('wrote e2e/fixtures/sample.png', png.length, 'bytes')
