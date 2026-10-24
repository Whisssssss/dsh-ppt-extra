# dsh-ppt 模板导入 · 实现契约（v1）

> 本文件是并行开发的唯一契约。任何实现偏离此契约，先改契约再改代码。

## 0. 目标

在 dsh-ppt 中新增「导入模板」能力：

1. 用户上传一份现成 .pptx，自动抽取「配色 / 字体 / 字号 / 固定品牌元素（校徽、班徽、班名、页脚等）」→ 得到模板草稿。
2. 也支持表单式导入：直接上传图片 + 选颜色。
3. 导入后在设置页用拖拽调整每个标志在 4 类页型（封面/章节/内容/结尾）上的位置与尺寸。
4. 生成演示文稿时选模板，HTML 与 PPTX 两端都套用同一份模板。

不做的：母版级版式继承（占位符几何、装饰形状不继承）。只做「视觉令牌 + 品牌固定层」。

## 1. 模板包存储

用户级目录：<DSH_HOME>/dsh-ppt/templates/（DSH_HOME 由 config 解析；config.templatesDir 可覆盖）。

每个模板一个目录：

~~~
<id>/
  template.json
  assets/<slot>.png
~~~

id 规则：^[a-z0-9][a-z0-9-]{1,39}$，与内置主题 id（swiss/velvet/data/soft/bold）不得重名。

## 2. template.json

~~~jsonc
{
  "schema": "dsh-ppt/template@1",
  "id": "demo-campus",
  "name": { "zh": "示例校园模板", "en": "Demo Campus" },
  "createdAt": "2026-10-25T00:00:00.000Z",
  "source": { "kind": "pptx", "file": "旧演示文稿.pptx", "sha256": "…" },
  "canvas": { "w": 13.3333, "h": 7.5 },
  "dark": false,
  "palette": { "bg":"#FFFFFF", "panel":"#F2F5F9", "fg":"#1A1A1A",
               "muted":"#6B7785", "accent":"#1F4E79", "accent2":"#C9A227" },
  "fonts": { "heading": "Microsoft YaHei", "body": "Microsoft YaHei", "accent": "STKaiti" },
  "typeScale": { "cover": 40, "section": 40, "title": 20, "body": 13, "caption": 10, "footer": 14 },
  "assets": {
    "universityLogo": { "file": "assets/universityLogo.png", "width": 732, "height": 166, "alpha": true },
    "classLogo":      { "file": "assets/classLogo.png", "width": 236, "height": 224, "alpha": true }
  },
  "chrome": {
    "cover":   [ { "kind":"image", "asset":"universityLogo", "box":[5.0,1.73,3.31,0.75] } ],
    "section": [ { "kind":"image", "asset":"classLogo", "box":[0.51,0.35,1.10,1.06] },
                 { "kind":"image", "asset":"universityLogo", "box":[10.28,0.55,2.28,0.51] } ],
    "content": [ { "kind":"image", "asset":"classLogo", "box":[0.20,6.50,1.06,1.02] },
                 { "kind":"text", "text":"示例班级名称", "box":[1.02,6.85,2.24,0.35],
                   "size":14, "color":"#1F4E79", "font":"accent", "align":"left" } ],
    "closing": [ { "kind":"image", "asset":"universityLogo", "box":[5.0,1.73,3.31,0.75] } ]
  }
}
~~~

### 单位与坐标

- box = [x, y, w, h]，单位**英寸**，画布 13.3333 × 7.5（16:9）。x+w ≤ 13.3333、y+h ≤ 7.5。
- 抽取时 EMU ÷ 914400 直接得英寸，不要经 cm 中转。
- 人工填写的 cm 值必须先 ÷ 2.54；示例 PPTX 的封面校徽在 cm 下是 (12.7, 4.4, 8.4, 1.9)，英寸即 (5.0, 1.73, 3.31, 0.75)。
- palette 所有值必须 ^#[0-9A-F]{6}$（大写存储）。
- typeScale 单位 pt，整数 8–96。
- chrome 四个键必须齐全（可为空数组）。

### chrome item

- kind:"image"：asset 必须存在于 assets。
- kind:"text"：text（1–200 字）、size（8–96pt）、color（#RRGGBB）、font（heading|body|accent）、align（left|center|right）。
- 每个页型最多 12 个 item；单个 box 必须落在画布内（允许 ±0.05 英寸溢出容差）。

### 页型映射（渲染时）

cover 页 → chrome.cover；section → chrome.section；closing → chrome.closing；
其余全部（bullets/statement/quote/table/image*/chart）→ chrome.content。

## 3. 主题合成契约（deck-template.mjs）

~~~js
export const CHROME_PAGE_TYPES = ['cover', 'section', 'content', 'closing']
export const TEMPLATE_SCHEMA = 'dsh-ppt/template@1'

/** 校验并归一化（不读文件系统）。抛 Error，消息前缀 'dsh-ppt：'。 */
export function normalizeTemplate(input) -> TemplateObject

/** 模板 → 渲染用 theme 对象，含 id/name/mood/bestFor/dark/palette/fonts
 *  以及扩展字段 chrome / chromeAssets / typeScale。
 *  chromeAssets: { [slot]: 'data:image/png;base64,...' } 由调用方注入。 */
export function templateToTheme(template, chromeAssets = {}) -> ThemeObject
~~~

rendering theme 扩展字段（deck-core 消费）：

~~~js
theme.chrome = { cover:[], section:[], content:[], closing:[] }
theme.chromeAssets = { [slot]: 'data:image/png;base64,...' }
theme.typeScale = { cover:40, section:40, title:20, body:13, caption:10, footer:14 }
theme.dark = false
theme.palette = { bg,panel,fg,muted,accent,accent2 }
theme.fonts = { heading, body, accent? }
~~~

## 4. resolveTheme 扩展（deck-core.mjs）

新增模块级 provider，不引入 fs 依赖：

~~~js
export function setTemplateThemeProvider(fn) // fn(id) -> themeObject | undefined
export function resolveTheme(input)          // 先查内置 THEMES，再查 provider，再抛错
~~~

错误消息保持现有风格：dsh-ppt：未知主题 "<id>"，可选：<内置 ids>（模板存在时附带模板 id 提示）。

listThemes(lang) 增加参数 listThemes(lang, templates = [])，把模板以同结构追加（id/name/mood/bestFor/dark/palette/fonts + custom:true）。第二参数缺省时行为不变。

## 5. 渲染注入

### HTML（deck-core.mjs / renderHtmlSlide）

在 renderHtmlSlide 生成的 <section class="slide"> 内部、内容层之后追加 chrome 层：

~~~html
<div class="chrome" aria-hidden="true">
  <img class="chrome-item" src="data:image/png;base64,…" alt=""
       style="left:95.25%;top:58.67%;width:63%;height:25.33%">
  <div class="chrome-item chrome-text"
       style="left:…;top:…;width:…;height:…;font-size:…;color:#1F4E79;text-align:left;
              font-family:var(--font-accent)">文字</div>
</div>
~~~

- 百分比基准 = 画布 13.3333 × 7.5。
- CSS：.chrome{position:absolute;inset:0;pointer-events:none;z-index:3}；.chrome-item{position:absolute;object-fit:contain}。
- 无 chrome 时不输出任何额外节点（保持现有 HTML 字节不变，避免破坏既有测试）。

### PPTX（deck-advanced.mjs / exportPptx）

在 manifest.slides.forEach 里，图片/图表/品牌之后，按页型注入 chrome：

- image：theme.chromeAssets[slot] 的 base64 解码为 Buffer，调 lib.addSlideImage(slide, bytes, { ...emu(box), name, fit:'contain' })。
- text：lib.addSlideTextBox(slide, { ...emu(box), text, name }) + lib.setShapeTextFormat(shape, { size, font: pptxFontName(...), color })。
- exportPptx 的早退条件（当前：无 brand/footer/image/chart 直接 return base）必须扩展：theme.chrome 任一非空时也走 office-kit 分支。

## 6. 工具层（src/*.ts）

新增工具：

| 工具 | 参数 | 返回 |
| --- | --- | --- |
| ppt_template_import | { file: string, id?: string, name?: string, dryRun?: boolean } | { ok, template, draft? } |
| ppt_template_list | {} | { ok, templates: [...] } |
| ppt_template_remove | { id: string, confirmed: boolean } | { ok, removed } |
| ppt_template_update | { id, chrome?, palette?, fonts?, typeScale?, name? } | { ok, template } |

ppt_create 新增参数 designTemplate: string（模板 id）。与 theme 同时给出时 designTemplate 优先，返回里注明 themeIgnored: true。

工程 JSON 新增字段 designTemplate；manifest.designTemplate 存在时，validateSnapshot 与 brandedTheme 走模板路径。

## 7. 抽取器契约（deck-template-extract.mjs）

~~~js
export function extractTemplateFromPptx(bytes, options = {}) -> {
  draft: TemplateObject,
  candidates: [{ slot, kind, pages:[1,3], box, width, height, alpha, dataSha256 }],
  stats: { colors:{}, fonts:[], sizes:[] }
}
~~~

算法：

1. fflate.unzipSync 解包（限制：单条目 16 MiB、总 128 MiB）。
2. ppt/theme/theme1.xml → clrScheme：dk1→fg、lt1→bg（按 lt1 相对亮度 >0.5 判浅底）、accent1→accent、accent2→accent2；dk2→muted、lt2→panel。字体取 majorFont/minorFont 的 a:ea（中文）优先，其次 a:latin。
3. 全量统计 a:srgbClr（分文字/填充）、a:rPr@sz、typeface，取众数修正 typeScale 与字体。
4. 遍历 ppt/slides/slideN.xml：收集 <p:pic>（r:embed → slideN.xml.rels → media）与 <p:sp> 文本（text、sz、box）。
5. 聚类：key = mediaSha256 | round(box, 0.05in)；出现页数 >=3 → 固定元素。文本：text | round(box,0.05) 出现 >=3 页 → 固定文本。
6. 页型归类：第 1 页 cover、最后一页 closing；其余按「固定元素集合指纹」分组，含最多页的组 = content；只有 1 个固定元素且有大号标题（>=32pt）的组 = section。
7. 输出 draft：palette/fonts/typeScale/chrome/assets；assets 图片 bytes 写入 options.assetsDir（若提供），否则以 base64 放 draftAssets 供上层落盘。
8. 透明化：所有抽取出的 PNG/JPEG 素材统一经 deck-pixels.mjs 转成带 alpha 的 PNG。

## 8. 像素模块契约（deck-pixels.mjs）

~~~js
export function decodeImage(bytes) -> { width, height, data: Uint8ClampedArray, format:'png'|'jpeg' }
export function encodePng({ width, height, data }) -> Buffer
export function makeTransparentWhite({ width, height, data }, options = {}) -> { width, height, data }
export function isTransparent({ width, height, data }) -> boolean
~~~

- makeTransparentWhite：从四边泛洪 flood fill，容差 tolerance=18（0–255），只把与边界连通的近白像素置 alpha=0，保留被深色包围的内部白（如瓶身高光）。
- 纯 JS，不新增 native 依赖。JPEG 解码用 jpeg-js（新增依赖，纯 JS）。
- PNG 编解码：fflate inflate/deflate + 手写 unfilter/filter（8-bit RGBA/RGB/Gray/Palette+tRNS）。

## 9. UI 契约（lib/client.js + src/workbench.ts）

workbench 新 operation（走现有 /api/dsh-ppt/workbench POST）：

| operation | body | 返回 |
| --- | --- | --- |
| template-list | — | { ok, templates:[{id,name,dark,palette}] } |
| template-extract | { file: base64, filename } | { ok, draft, candidates } |
| template-save | { template, assets: {slot: base64} } | { ok, template } |
| template-update | { id, chrome, palette?, fonts? } | { ok, template } |
| template-remove | { id, confirmed:true } | { ok } |

UI：设置页「演示文稿」区块内新增 TemplatePanel：

1. 模板列表（内置 5 套只读 + 自定义可删）
2. 「导入模板」→ 上传 .pptx 或「手动创建」
3. 摆位画布：aspect-ratio 16/9 容器，4 个页型 tab；chrome item 可拖拽（pointer events）、可 8 向缩放、可删除、可改数值
4. 保存 / 取消

拖拽要求：pointerdown/move/up、百分比坐标、吸附 0.1%、方向键微调（Shift ×10）。

## 10. 文件边界（并行开发，禁止越界）

| 负责人 | 文件 |
| --- | --- |
| Lead | src/types.ts, src/config.ts, src/templates.ts(新), src/tools.ts, src/index.ts, docs/TEMPLATE-IMPORT.md |
| engine | skills/dsh-ppt/scripts/deck-core.mjs, deck-media.mjs, deck-advanced.mjs |
| extract | skills/dsh-ppt/scripts/deck-template.mjs(新), deck-template-extract.mjs(新), deck-pixels.mjs(新) |
| ui | lib/client.js, src/workbench.ts |

测试文件：各自新建 test/template-*.test.mjs，不改他人测试文件。

## 11. 验收

1. pnpm run typecheck 通过。
2. pnpm test（现有 22 个测试文件全绿 + 新增测试）。
3. 用示例 旧演示文稿.pptx 导入，得到 draft 模板，含 >=2 个品牌素材与 4 类页 chrome。
4. 生成一份新 PPT，HTML 与 PPTX 同页均出现校徽/班徽，位置与模板一致。
5. dsh-sandbox 隔离实例中全量回归。
