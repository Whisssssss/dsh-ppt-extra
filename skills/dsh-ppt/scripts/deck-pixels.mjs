#! /usr/bin/env node
/**
 * deck-pixels.mjs —— dsh-ppt 的纯 JS 像素层（模板导入共用）。
 *
 * 职责（SPEC §8）：
 *   decodeImage           PNG / JPEG → RGBA
 *   encodePng             RGBA → PNG
 *   makeTransparentWhite  四边泛洪把与边界连通的近白像素抠成透明
 *   isTransparent         四角 alpha 均值判定是否带透明底
 *
 * PNG：fflate 解压 + 手写 unfilter（8-bit RGBA/RGB/Gray/GrayAlpha/Palette+tRNS，
 *       非隔行）。16-bit、隔行、其它颜色类型明确抛错，不静默出错。
 *       注意 PNG 的 IDAT 是 zlib 包裹，fflate 的 inflateSync/deflateSync 只处理
 *       裸 DEFLATE，因此这里用同库的 unzlibSync/zlibSync。
 * JPEG：jpeg-js（纯 JS，按需 await import，避免未用到的路径拉高冷启动）。
 *
 * 错误消息统一前缀 'dsh-ppt：'。
 */

import { unzlibSync, zlibSync } from 'fflate'

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const PNG_CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }
const MAX_PIXELS = 64 * 1024 * 1024

function fail(message) {
  throw new Error('dsh-ppt：' + message)
}

function asBuffer(input) {
  if (Buffer.isBuffer(input)) return input
  if (input instanceof Uint8Array) return Buffer.from(input.buffer, input.byteOffset, input.byteLength)
  if (input instanceof ArrayBuffer) return Buffer.from(input)
  fail('图片字节必须是 Buffer / Uint8Array / ArrayBuffer')
}

function checkImageSize(width, height) {
  const w = Number(width)
  const h = Number(height)
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) fail('图片尺寸非法：' + width + '×' + height)
  if (w * h > MAX_PIXELS) fail('图片像素过大：' + w + '×' + h + '（上限 ' + MAX_PIXELS + ' 像素）')
  return { w, h }
}

function validateImage(image) {
  if (!image || typeof image !== 'object') fail('图片对象必须包含 width / height / data')
  const { w, h } = checkImageSize(image.width, image.height)
  const data = image.data
  if (!(data instanceof Uint8Array) && !(data instanceof Uint8ClampedArray)) fail('图片 data 必须是 Uint8Array / Uint8ClampedArray')
  if (data.length < w * h * 4) fail('图片 data 长度不足：需要 ' + w * h * 4 + ' 字节，实际 ' + data.length)
  return { width: w, height: h, data }
}

function clampTolerance(value, message) {
  const tolerance = value === undefined ? 18 : Number(value)
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 255) fail(message)
  return tolerance
}

// ---------------------------------------------------------------------------
// PNG 解码
// ---------------------------------------------------------------------------

function readPngChunks(buffer) {
  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    fail('不是有效的 PNG 文件（签名不符）')
  }
  const chunks = []
  let offset = PNG_SIGNATURE.length
  let ended = false
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('latin1', offset + 4, offset + 8)
    const start = offset + 8
    const end = start + length
    if (end + 4 > buffer.length) fail('PNG 数据被截断（' + type + ' 块）')
    chunks.push({ type, data: buffer.subarray(start, end) })
    offset = end + 4
    if (type === 'IEND') {
      ended = true
      break
    }
  }
  if (!ended) fail('PNG 缺少 IEND 结束块')
  return chunks
}

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft
  const dl = Math.abs(estimate - left)
  const du = Math.abs(estimate - up)
  const dul = Math.abs(estimate - upLeft)
  if (dl <= du && dl <= dul) return left
  if (du <= dul) return up
  return upLeft
}

function unfilterPng(raw, width, height, channels) {
  const stride = width * channels
  const needed = (stride + 1) * height
  if (raw.length < needed) fail('PNG 像素数据不完整：需要 ' + needed + ' 字节，实际 ' + raw.length)
  let offset = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[offset]
    offset += 1
    const lineStart = offset
    const prevStart = lineStart - stride - 1
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? raw[lineStart + x - channels] : 0
      const up = y > 0 ? raw[prevStart + x] : 0
      const upLeft = y > 0 && x >= channels ? raw[prevStart + x - channels] : 0
      let value
      switch (filter) {
        case 0: value = raw[lineStart + x]; break
        case 1: value = raw[lineStart + x] + left; break
        case 2: value = raw[lineStart + x] + up; break
        case 3: value = raw[lineStart + x] + ((left + up) >> 1); break
        case 4: value = raw[lineStart + x] + paeth(left, up, upLeft); break
        default: fail('PNG 行过滤类型非法：' + filter)
      }
      raw[lineStart + x] = value & 0xff
    }
    offset += stride
  }
}

function decodePng(bytes) {
  const buffer = asBuffer(bytes)
  const chunks = readPngChunks(buffer)
  const header = chunks[0]
  if (!header || header.type !== 'IHDR' || header.data.length < 13) fail('PNG 缺少 IHDR 头信息')
  const width = header.data.readUInt32BE(0)
  const height = header.data.readUInt32BE(4)
  const bitDepth = header.data[8]
  const colorType = header.data[9]
  const compression = header.data[10]
  const filterMethod = header.data[11]
  const interlace = header.data[12]
  checkImageSize(width, height)
  if (compression !== 0 || filterMethod !== 0) fail('PNG 压缩 / 过滤方法不受支持')
  if (interlace !== 0) fail('不支持隔行（Adam7）PNG，请先另存为非隔行图片')
  if (bitDepth !== 8) fail('仅支持 8-bit PNG，当前为 ' + bitDepth + '-bit，请先另存为 8-bit')
  const channels = PNG_CHANNELS[colorType]
  if (!channels) fail('不支持的 PNG 颜色类型：' + colorType)

  let palette = null
  let trns = null
  const idat = []
  for (const chunk of chunks) {
    if (chunk.type === 'PLTE') palette = chunk.data
    else if (chunk.type === 'tRNS') trns = chunk.data
    else if (chunk.type === 'IDAT') idat.push(chunk.data)
  }
  if (colorType === 3 && !palette) fail('调色板 PNG 缺少 PLTE 块')
  if (!idat.length) fail('PNG 缺少 IDAT 像素数据')

  const compressed = Buffer.concat(idat)
  let raw
  try {
    raw = Buffer.from(unzlibSync(compressed))
  } catch (error) {
    fail('PNG 像素数据解压失败：' + error.message)
  }
  unfilterPng(raw, width, height, channels)

  const out = new Uint8ClampedArray(width * height * 4)
  const stride = width * channels
  const transparentGray = colorType === 0 && trns && trns.length >= 2 ? trns.readUInt16BE(0) : -1
  const transparentRgb = colorType === 2 && trns && trns.length >= 6 ? [trns.readUInt16BE(0), trns.readUInt16BE(2), trns.readUInt16BE(4)] : null

  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1) + 1
    for (let x = 0; x < width; x++) {
      const src = row + x * channels
      const dst = (y * width + x) * 4
      if (colorType === 0) {
        const gray = raw[src]
        out[dst] = gray
        out[dst + 1] = gray
        out[dst + 2] = gray
        out[dst + 3] = gray === transparentGray ? 0 : 255
      } else if (colorType === 2) {
        const r = raw[src]
        const g = raw[src + 1]
        const b = raw[src + 2]
        out[dst] = r
        out[dst + 1] = g
        out[dst + 2] = b
        out[dst + 3] = transparentRgb && r === transparentRgb[0] && g === transparentRgb[1] && b === transparentRgb[2] ? 0 : 255
      } else if (colorType === 3) {
        const index = raw[src]
        const entry = index * 3
        if (entry + 2 >= palette.length) fail('调色板索引越界：' + index)
        out[dst] = palette[entry]
        out[dst + 1] = palette[entry + 1]
        out[dst + 2] = palette[entry + 2]
        out[dst + 3] = trns && index < trns.length ? trns[index] : 255
      } else if (colorType === 4) {
        const gray = raw[src]
        out[dst] = gray
        out[dst + 1] = gray
        out[dst + 2] = gray
        out[dst + 3] = raw[src + 1]
      } else {
        out[dst] = raw[src]
        out[dst + 1] = raw[src + 1]
        out[dst + 2] = raw[src + 2]
        out[dst + 3] = raw[src + 3]
      }
    }
  }
  return { width, height, data: out, format: 'png' }
}

// ---------------------------------------------------------------------------
// JPEG 解码（jpeg-js，纯 JS）
// ---------------------------------------------------------------------------

async function decodeJpeg(bytes) {
  let jpeg
  try {
    jpeg = await import('jpeg-js')
  } catch (error) {
    fail('JPEG 解码需要 jpeg-js 依赖，但加载失败：' + error.message)
  }
  const api = jpeg && jpeg.decode ? jpeg : jpeg && jpeg.default
  if (!api || typeof api.decode !== 'function') fail('jpeg-js 模块结构异常，缺少 decode()')
  let decoded
  try {
    decoded = api.decode(asBuffer(bytes), { useTArray: true, formatAsRGBA: true, maxResolutionInMP: 80 })
  } catch (error) {
    fail('JPEG 解码失败：' + error.message)
  }
  if (!decoded || !decoded.width || !decoded.height || !decoded.data) fail('JPEG 解码结果不完整')
  checkImageSize(decoded.width, decoded.height)
  const data = new Uint8ClampedArray(decoded.data.length)
  data.set(decoded.data)
  return { width: decoded.width, height: decoded.height, data, format: 'jpeg' }
}

// ---------------------------------------------------------------------------
// 对外 API
// ---------------------------------------------------------------------------

/**
 * 解码 PNG / JPEG 为 RGBA。JPEG 走 await import('jpeg-js')，因此本函数是 async。
 * 返回 { width, height, data: Uint8ClampedArray, format: 'png' | 'jpeg' }。
 */
export async function decodeImage(bytes) {
  const buffer = asBuffer(bytes)
  if (buffer.length >= PNG_SIGNATURE.length && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return decodePng(buffer)
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return decodeJpeg(buffer)
  const head = buffer.subarray(0, 4).toString('latin1').replace(/[^\x20-\x7e]/g, '?')
  fail('不支持的图片格式（仅支持 PNG / JPEG，文件头 "' + head + '"）')
}

let crcTable = null

function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c
    }
  }
  let crc = -1
  for (let i = 0; i < buffer.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ buffer[i]) & 0xff]
  return (crc ^ -1) >>> 0
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBytes = Buffer.from(type, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0)
  return Buffer.concat([length, typeBytes, data, crc])
}

/**
 * RGBA → PNG（8-bit RGBA，非隔行）。返回 Buffer。
 */
export function encodePng(image) {
  const { width, height, data } = validateImage(image)
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0
    Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1)
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8
  header[9] = 6
  header[10] = 0
  header[11] = 0
  header[12] = 0
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', Buffer.from(zlibSync(raw, { level: 9 }))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * 从四边泛洪：只把「与边界连通的近白像素」alpha 置 0。
 * 被深色包围的内部白（瓶身高光、反白文字）保留。
 * 原地修改 data 并返回同一对象。
 */
export function makeTransparentWhite(image, options = {}) {
  const { width, height, data } = validateImage(image)
  const tolerance = clampTolerance(options.tolerance, 'tolerance 必须是 0–255 的数值')
  const total = width * height
  const seen = new Uint8Array(total)
  const queue = new Int32Array(total)
  let head = 0
  let tail = 0
  const enqueue = (index) => {
    if (seen[index]) return
    seen[index] = 1
    const offset = index * 4
    if (data[offset + 3] === 0) return
    const nearWhite = 255 - data[offset] <= tolerance && 255 - data[offset + 1] <= tolerance && 255 - data[offset + 2] <= tolerance
    if (!nearWhite) return
    queue[tail++] = index
  }
  for (let x = 0; x < width; x++) {
    enqueue(x)
    enqueue((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    enqueue(y * width)
    enqueue(y * width + width - 1)
  }
  while (head < tail) {
    const index = queue[head++]
    data[index * 4 + 3] = 0
    const x = index % width
    if (x > 0) enqueue(index - 1)
    if (x + 1 < width) enqueue(index + 1)
    if (index >= width) enqueue(index - width)
    if (index + width < total) enqueue(index + width)
  }
  return { width, height, data }
}

/**
 * 四角 alpha 均值 < 8 视为透明底。
 */
export function isTransparent(image) {
  const { width, height, data } = validateImage(image)
  const corners = [0, width - 1, (height - 1) * width, height * width - 1]
  let sum = 0
  for (const index of corners) sum += data[index * 4 + 3]
  return sum / corners.length < 8
}
