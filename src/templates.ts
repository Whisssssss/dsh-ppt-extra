/**
 * 用户级模板库 + 引擎桥接。
 *
 * 模板存放在 <DSH_HOME>/dsh-ppt/templates/<id>/（template.json + assets/*.png）。
 * 加载时把模板注册为 deck-core 的 theme provider，使 theme / designTemplate 参数
 * 可以直接使用模板 id，HTML 与 PPTX 两端走同一条主题解析路径。
 *
 * 本模块不引入图片解码：像素处理在 skills/dsh-ppt/scripts/deck-pixels.mjs。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import { homedir } from 'node:os'
import { randomUUID } from 'node:crypto'

export const TEMPLATE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/
export const BUILTIN_THEME_IDS = ['swiss', 'velvet', 'data', 'soft', 'bold'] as const
const MAX_ASSET_BYTES = 5 * 1024 * 1024
const MAX_TOTAL_BYTES = 32 * 1024 * 1024

export interface PptTemplateSummary {
  id: string
  name: string
  dark: boolean
  palette: Record<string, string>
}

export interface PptTemplateDetail extends PptTemplateSummary {
  /** 模板 JSON 原文（含 chrome / fonts / typeScale / assets 元数据）。 */
  template: Record<string, any>
  /** slot -> data:image/png;base64,...，供界面直接预览。 */
  assets: Record<string, string>
}

let dirOverride: string | undefined

/** 测试或宿主覆盖模板目录；传 undefined 恢复默认。 */
export function setTemplateDir(dir: string | undefined): void {
  dirOverride = dir
}

/** 解析模板根目录：覆盖值 > config.templatesDir > <DSH_HOME>/dsh-ppt/templates。 */
export function templatesDir(): string {
  if (dirOverride !== undefined) return resolve(dirOverride)
  const home = (process.env.DSH_HOME ?? '').trim() || join(homedir(), '.dsh')
  return resolve(home, 'dsh-ppt', 'templates')
}

function fail(message: string): never {
  throw new Error('dsh-ppt：' + message)
}

function templateDir(id: string): string {
  const value = String(id ?? '').trim()
  if (!TEMPLATE_ID_PATTERN.test(value)) fail('模板 id 需为 2–40 位小写字母、数字或连字符：' + value)
  if ((BUILTIN_THEME_IDS as readonly string[]).includes(value)) fail('模板 id 不能与内置主题同名：' + value)
  return join(templatesDir(), value)
}

function inside(root: string, target: string): boolean {
  const base = resolve(root)
  const real = resolve(target)
  return real === base || real.startsWith(base + sep)
}

/** 只读摘要列表；目录不存在时返回空数组。 */
export function listTemplates(): PptTemplateSummary[] {
  const root = templatesDir()
  if (!existsSync(root)) return []
  const out: PptTemplateSummary[] = []
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const file = join(root, entry.name, 'template.json')
    if (!existsSync(file)) continue
    try {
      const template = JSON.parse(readFileSync(file, 'utf8')) as Record<string, any>
      out.push({
        id: String(template.id ?? entry.name),
        name: String(template.name?.zh ?? template.name?.en ?? entry.name),
        dark: template.dark === true,
        palette: { ...(template.palette ?? {}) } as Record<string, string>,
      })
    } catch { /* 跳过损坏条目，不影响其余模板 */ }
  }
  return out.sort((a, b) => a.id.localeCompare(b.id))
}

/** 完整模板 + 素材 dataURI；不存在抛错。 */
export function readTemplate(id: string): PptTemplateDetail {
  const dir = templateDir(id)
  const file = join(dir, 'template.json')
  if (!existsSync(file)) fail('模板不存在：' + id)
  const template = JSON.parse(readFileSync(file, 'utf8')) as Record<string, any>
  const assets: Record<string, string> = {}
  for (const [slot, meta] of Object.entries(template.assets ?? {})) {
    const rel = String((meta as Record<string, any>)?.file ?? '')
    const path = resolve(dir, rel)
    if (!rel || !inside(dir, path) || !existsSync(path)) continue
    assets[slot] = 'data:image/png;base64,' + readFileSync(path).toString('base64')
  }
  return {
    id: String(template.id ?? id),
    name: String(template.name?.zh ?? template.name?.en ?? id),
    dark: template.dark === true,
    palette: { ...(template.palette ?? {}) } as Record<string, string>,
    template,
    assets,
  }
}

function decodeDataUri(value: string, label: string): Buffer {
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(value)
  if (!match) fail('模板素材 ' + label + ' 需为 PNG/JPEG 的 data URI')
  const bytes = Buffer.from(match[2], 'base64')
  if (bytes.length === 0 || bytes.length > MAX_ASSET_BYTES) fail('模板素材 ' + label + ' 超过 5 MiB 或为空')
  return bytes
}

/** 写入（新建或覆盖）一个模板；assets 为 slot -> dataURI。 */
export async function saveTemplate(input: { template: unknown; assets?: Record<string, string> }): Promise<PptTemplateDetail> {
  if (!input || typeof input !== 'object') fail('缺少 template')
  const modules = await loadModules()
  const template = modules.template.normalizeTemplate(input.template) as Record<string, any>
  const id = String(template.id)
  const assets = input.assets ?? {}
  const root = templatesDir()
  const dir = templateDir(id)
  if (!inside(root, dir)) fail('模板目录越界')
  mkdirSync(root, { recursive: true })
  const staging = join(root, '.' + id + '-staging-' + randomUUID())
  mkdirSync(staging, { recursive: true })
  try {
    mkdirSync(join(staging, 'assets'), { recursive: true })
    let total = 0
    const files: Record<string, string> = {}
    for (const slot of Object.keys(template.assets ?? {})) {
      const data = assets[slot]
      if (typeof data !== 'string' || data === '') continue
      const bytes = decodeDataUri(data, slot)
      total += bytes.length
      if (total > MAX_TOTAL_BYTES) fail('模板素材总量超过 32 MiB')
      const file = 'assets/' + slot.replace(/[^a-zA-Z0-9_-]/g, '_') + '.png'
      writeFileSync(join(staging, file), bytes)
      files[slot] = file
    }
    for (const [slot, meta] of Object.entries(template.assets ?? {})) {
      const record = meta as Record<string, any>
      const declared = String(record.file ?? '')
      const isNew = files[slot] !== undefined
      if (!isNew && declared) {
        const previous = join(dir, declared)
        if (inside(dir, previous) && existsSync(previous)) {
          const target = join(staging, 'assets', declared.split('/').pop() as string)
          writeFileSync(target, readFileSync(previous))
          files[slot] = 'assets/' + (declared.split('/').pop() as string)
        }
      }
    }
    for (const slot of Object.keys(template.assets ?? {})) {
      if (!files[slot]) fail('模板素材缺失：' + slot)
      template.assets[slot].file = files[slot]
    }
    writeFileSync(join(staging, 'template.json'), JSON.stringify(template, null, 2) + '\n', 'utf8')
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
    renameSync(staging, dir)
  } catch (error) {
    rmSync(staging, { recursive: true, force: true })
    throw error
  }
  return readTemplate(id)
}

/** 合并更新（chrome / palette / fonts / typeScale / name 等）。 */
export async function updateTemplate(id: string, patch: unknown): Promise<PptTemplateDetail> {
  const current = readTemplate(id)
  if (patch !== undefined && (patch === null || typeof patch !== 'object' || Array.isArray(patch))) fail('patch 必须是对象')
  const next = { ...current.template, ...(patch as Record<string, unknown>) }
  next.id = current.template.id
  return await saveTemplate({ template: next, assets: current.assets })
}

/** 删除模板；返回是否实际删除。 */
export function removeTemplate(id: string): boolean {
  const dir = templateDir(id)
  if (!inside(templatesDir(), dir)) fail('模板目录越界')
  if (!existsSync(dir)) return false
  if (!statSync(dir).isDirectory()) fail('模板路径不是目录：' + id)
  rmSync(dir, { recursive: true, force: true })
  return true
}

// ---------------------------------------------------------------------------
// 引擎桥接
// ---------------------------------------------------------------------------

interface TemplateModule {
  normalizeTemplate(input: unknown): unknown
  templateToTheme(template: unknown, chromeAssets?: Record<string, string>): any
}

interface CoreModule {
  setTemplateThemeProvider(fn: (id: string) => any): void
}

interface ExtractModule {
  extractTemplateFromPptx(bytes: Buffer, options?: Record<string, unknown>): any
}

const moduleUrl = (relative: string): string => new URL(relative, import.meta.url).href

let modulesPromise: Promise<{ template: TemplateModule; core: CoreModule; extract: ExtractModule }> | null = null
let providerInstalled = false
let cachedTemplateModule: TemplateModule | undefined

function loadModules() {
  if (!modulesPromise) {
    modulesPromise = Promise.all([
      import(moduleUrl('../skills/dsh-ppt/scripts/deck-template.mjs')),
      import(moduleUrl('../skills/dsh-ppt/scripts/deck-core.mjs')),
      import(moduleUrl('../skills/dsh-ppt/scripts/deck-template-extract.mjs')),
    ]).then(([template, core, extract]) => {
      cachedTemplateModule = template as unknown as TemplateModule
      return { template: template as unknown as TemplateModule, core: core as unknown as CoreModule, extract: extract as unknown as ExtractModule }
    }).catch(error => { modulesPromise = null; throw error })
  }
  return modulesPromise
}

/** 同步构造 theme；provider 必须同步。读盘失败返回 undefined，让 resolveTheme 走原错误路径。 */
function buildTheme(id: string): any {
  try {
    const dir = templateDir(id)
    const file = join(dir, 'template.json')
    if (!existsSync(file)) return undefined
    const template = JSON.parse(readFileSync(file, 'utf8')) as Record<string, any>
    const assets: Record<string, string> = {}
    for (const [slot, meta] of Object.entries(template.assets ?? {})) {
      const rel = String((meta as Record<string, any>)?.file ?? '')
      const path = resolve(dir, rel)
      if (!rel || !inside(dir, path) || !existsSync(path)) continue
      assets[slot] = 'data:image/png;base64,' + readFileSync(path).toString('base64')
    }
    if (!cachedTemplateModule) return undefined
    return cachedTemplateModule.templateToTheme(template, assets)
  } catch { return undefined }
}

/**
 * 注册 theme provider（幂等）；任何模板相关调用前必须 await。
 * 模板模块损坏或缺失时静默降级：内置主题、普通生成不受影响。
 */
export async function ensureTemplateProvider(): Promise<void> {
  if (providerInstalled) return
  try {
    const modules = await loadModules()
    modules.core.setTemplateThemeProvider((id: string) => buildTheme(id))
    providerInstalled = true
  } catch { /* 模板功能不可用，不影响内置主题 */ }
}

/** 模板模块是否可用（供工具层给出明确错误而不是「未知主题」）。 */
export async function templateModulesReady(): Promise<boolean> {
  try { await loadModules(); return true } catch { return false }
}

/** 从 .pptx 字节抽取模板草稿（不落盘）。 */
export async function extractFromPptxFile(bytes: Buffer, filename: string): Promise<unknown> {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0) fail('上传的 PPTX 为空')
  if (bytes.length > 64 * 1024 * 1024) fail('上传的 PPTX 超过 64 MiB')
  const modules = await loadModules()
  await ensureTemplateProvider()
  return modules.extract.extractTemplateFromPptx(bytes, { filename })
}
