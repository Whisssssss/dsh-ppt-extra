// Browser source, distributed directly. tsc deliberately does not rewrite this file.
window.__ModuleLoader__.load({ id: 'dsh-ppt', factory: require => {
  const React = require('react');
var __FR_KEY = "dsh-first-run:dsh-ppt:v1";
var __FR_TITLE = "演示文稿 · 首次使用（4 步）";
var __FR_TITLE_EN = "Presentations · First steps";
var __FR_STEPS_EN = [{title:"Choose a theme",body:"Choose from swiss, velvet, data, soft and bold before building your presentation."},{title:"Provide actual material",body:"Give the assistant your points, data and tables. It produces an editable PPTX and an HTML presentation.",tryIt:"Turn this quarterly update into eight slides using the data theme."},{title:"Review in the browser",body:"Step through the HTML preview, then edit text, images and speaker notes in this panel."},{title:"Check the final slides",body:"Review the final PPTX in PowerPoint or WPS, or use the optional renderer to check fonts and layout before delivery."}];
var __FR_STEPS = [{"title":"先选主题","body":"内置 5 套主题（swiss / velvet / data / soft / bold），先定风格再生成内容。"},{"title":"给内容，不给空话","body":"把要点、数据、表格直接给助手，它会排成幻灯片并同时产出 PPTX 与网页版。","tryIt":"把这份季度总结做成 8 页汇报，用 data 主题"},{"title":"先在浏览器里过一遍","body":"网页版可直接翻页预览，确认排版没问题再导出。"},{"title":"导出后看图核对","body":"渲染成图检查一遍再交付，避免字体缺失或溢出。"}];

// ---- first-run guide (shared snippet; keep in sync across plugins) ----
var __FR_STYLE_ID = 'dsh-first-run-css';
var __FR_CSS = [
  '.fr-card{border:1px solid var(--dsw-border,rgba(0,0,0,.10));border-radius:12px;padding:14px 16px;margin:0 0 14px;background:linear-gradient(180deg,rgba(59,130,246,.06),rgba(59,130,246,.02))}',
  '.fr-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}',
  '.fr-dot{width:6px;height:6px;border-radius:50%;background:var(--dsw-accent,#3b82f6)}',
  '.fr-title{font-weight:650;font-size:13.5px}',
  '.fr-count{margin-left:auto;font-size:11px;color:var(--dsw-text-weak,#6b7280);font-variant-numeric:tabular-nums}',
  '.fr-step{font-weight:600;font-size:13px;margin:2px 0 4px}',
  '.fr-body{color:var(--dsw-text-weak,#4b5563);font-size:12.5px;line-height:1.65}',
  '.fr-try{margin-top:8px;padding:7px 9px;border-radius:8px;background:rgba(59,130,246,.09);font-size:12px;display:flex;gap:8px}',
  '.fr-try code{font-family:ui-monospace,monospace;white-space:pre-wrap;word-break:break-word}',
  '.fr-bar{display:flex;gap:8px;align-items:center;margin-top:12px}',
  '.fr-progress{display:flex;gap:4px;margin-right:auto}',
  '.fr-seg{width:16px;height:3px;border-radius:2px;background:var(--dsw-border,rgba(0,0,0,.12))}',
  '.fr-seg.on{background:var(--dsw-accent,#3b82f6)}',
  '.fr-btn{border:1px solid var(--dsw-border,rgba(0,0,0,.14));background:transparent;color:inherit;border-radius:8px;padding:4px 10px;font-size:12px;cursor:pointer}',
  '.fr-btn:hover{background:rgba(0,0,0,.04)}',
  '.fr-btn.primary{background:var(--dsw-accent,#3b82f6);border-color:transparent;color:#fff}',
  '.fr-btn.ghost{border-color:transparent;color:var(--dsw-text-weak,#6b7280)}',
].join('\n');
function __frEnsureCss() {
  if (typeof document === 'undefined' || document.getElementById(__FR_STYLE_ID)) return;
  var el = document.createElement('style');
  el.id = __FR_STYLE_ID;
  el.textContent = __FR_CSS;
  document.head.appendChild(el);
}
function __frRead() { try { return localStorage.getItem(__FR_KEY) === 'done'; } catch (e) { return false; } }
function __frWrite() { try { localStorage.setItem(__FR_KEY, 'done'); } catch (e) {} }
function __FirstRunCard(props) {
  useLanguage(props?.locale || localeService);
  var english = languageOf(props?.locale || localeService) === 'en';
  var steps = english ? __FR_STEPS_EN : __FR_STEPS;
  var text = (zh, en) => english ? en : zh;
  var doneState = React.useState(__frRead);
  var done = doneState[0], setDone = doneState[1];
  var idxState = React.useState(0);
  var index = idxState[0], setIndex = idxState[1];
  React.useEffect(function () { __frEnsureCss(); }, []);
  if (done) return null;
  var step = steps[index];
  var last = index >= steps.length - 1;
  var close = function () { __frWrite(); setDone(true); };
  var kids = [
    React.createElement('div', { className: 'fr-head', key: 'h' },
      React.createElement('span', { className: 'fr-dot' }),
      React.createElement('span', { className: 'fr-title' }, english ? __FR_TITLE_EN : __FR_TITLE),
      React.createElement('span', { className: 'fr-count' }, (index + 1) + ' / ' + steps.length)),
    React.createElement('div', { className: 'fr-step', key: 't' }, step.title),
    React.createElement('div', { className: 'fr-body', key: 'b' }, step.body),
  ];
  if (step.tryIt) kids.push(React.createElement('div', { className: 'fr-try', key: 'y' },
    React.createElement('span', null, text('可以直接说', 'Try saying')),
    React.createElement('code', null, text('「', '“') + step.tryIt + text('」', '”'))));
  var buttons = [React.createElement('div', { className: 'fr-progress', key: 'p' }, steps.map(function (_, i) {
    return React.createElement('span', { key: i, className: 'fr-seg' + (i <= index ? ' on' : '') });
  }))];
  buttons.push(React.createElement('button', { className: 'fr-btn ghost', type: 'button', onClick: close, key: 's' }, text('跳过', 'Skip')));
  if (index > 0) buttons.push(React.createElement('button', { className: 'fr-btn', type: 'button', key: 'prev', onClick: function () { setIndex(index - 1); } }, text('上一步', 'Back')));
  buttons.push(React.createElement('button', { className: 'fr-btn primary', type: 'button', key: 'next', onClick: function () { if (last) close(); else setIndex(index + 1); } }, last ? text('开始使用', 'Start') : text('下一步', 'Next')));
  kids.push(React.createElement('div', { className: 'fr-bar', key: 'bar' }, buttons));
  return React.createElement('div', { className: 'fr-card' }, kids);
}
function __withFirstRun(Component) {
  return function FirstRunWrapped(props) {
    return React.createElement(React.Fragment, null, React.createElement(__FirstRunCard, props), React.createElement(Component, props));
  };
}
// ---- end first-run guide ----

  const { useState, useEffect, useRef, useMemo } = React;
  const h = React.createElement;

// Interface language follows DSH; user content and stored records keep their original text.
let localeService;
const EN = Object.freeze({
  "标题": "Title",
  "副标题": "Subtitle",
  "眉题": "Kicker",
  "正文": "Body text",
  "要点（每行一条）": "Bullets (one per line)",
  "演讲备注": "Speaker notes",
  "无法读取服务响应，请检查插件是否加载": "Could not read the server response. Check that the plugin is loaded.",
  "操作未完成": "The operation did not complete.",
  "正在处理，请稍候…": "Working, please wait…",
  "操作失败": "Operation failed.",
  "已定位到": "Focused ",
  "，在字段中修改后保存。": ". Edit this field, then save.",
  "点击预览里的文字，或在下方修改字段。": "Click text in the preview, or edit the fields below.",
  "当前页已被删除，输入仍保留，请复制需要的内容后取消修改。": "This slide was deleted. Your input is preserved; copy anything you need before cancelling your edits.",
  "已载入最新版本并保留你的修改，请核对后再保存。": "Latest version loaded with your edits preserved. Review before saving.",
  "内容没有变化。": "No changes to save.",
  "已保存，HTML、PPTX 和工程文件已同步更新。": "Saved. HTML, PPTX and project files were updated together.",
  "页面顺序已更新，可撤销。": "Slides reordered. You can undo this change.",
  "复制本页": "Duplicate slide",
  "删除本页": "Delete slide",
  "页面已复制，图片、图表和备注一并保留，可撤销。": "Slide duplicated with its images, charts and notes. You can undo this change.",
  "页面已删除，可撤销。": "Slide deleted. You can undo this change.",
  "已撤销上次修改。": "Last change undone.",
  "当前 PPTX 已生成逐页图片，请查看画面。": "Slide images were rendered from the current PPTX. Review each slide.",
  "正在渲染最终 PPTX，较大文件可能需要几分钟…": "Rendering the final PPTX. Large files may take a few minutes…",
  "已请求下载，请查看浏览器的下载列表。": "Download requested. Check your browser’s downloads.",
  "请选择 5 MiB 以内的 PNG 或 JPEG 图片。": "Choose a PNG or JPEG image up to 5 MiB.",
  "无法读取图片，请重试。": "Could not read the image. Try again.",
  "正在读取图片，切换页面会取消本次读取。": "Reading the image. Switching slides cancels this upload.",
  "图片已载入，保存后生效。": "Image loaded. Save this slide to apply it.",
  "下载讲稿 Markdown": "Download speaker notes",
  "另存副本": "Save a copy",
  "副本已保存，原文件保留。副本从工程生成，不包含 Office 手工修改。": "Copy saved. Original files are preserved. The copy is rebuilt from the project and does not include external Office edits.",
  "演示文稿编辑": "Presentation editor",
  "修改本插件生成的成品，保存时同步更新 HTML、可编辑 PPTX 和工程文件。": "Edit presentations generated by this plugin. Saving updates the HTML, editable PPTX and project file together.",
  "载入最新版本，保留我的输入": "Load latest and keep my input",
  "刷新项目": "Refresh projects",
  "还没有可以编辑的项目": "No editable projects yet",
  "先在对话中让助手生成演示文稿。已有项目可以让助手调用 ppt_check 检查一次，它会出现在这里。": "Ask the assistant to generate a presentation in chat. For an existing project, ask it to run ppt_check; the project will appear here.",
  "示例：请把这份材料制作成可直接交付的演示文稿，生成 HTML、PPTX 和工程文件。": "Example: Turn this material into a presentation ready to deliver, including HTML, PPTX and project files.",
  "返回项目": "Back to projects",
  " 页 · 修订 ": " slides · Revision ",
  "页面": "Slides",
  "未命名页": "Untitled slide",
  "上移": "Move up",
  "下移": "Move down",
  "HTML 预览": "HTML preview",
  "最终 PPTX 预览": "Final PPTX preview",
  "渲染当前 PPTX": "Render current PPTX",
  "演示文稿 HTML 预览": "Presentation HTML preview",
  "此项目尚无 HTML，请保存一次生成预览。": "This project has no HTML yet. Save to generate a preview.",
  "最终 PPTX 第 ": "Final PPTX slide ",
  " 页渲染结果": " rendered image",
  "正在载入当前页渲染…": "Loading the rendered slide…",
  "这是 HTML 放映预览。最终 PPTX 的字体和排版请用上方渲染检查。点击文字可定位编辑字段。": "This is the HTML playback preview. Use the render controls above to check fonts and layout in the final PPTX. Click text to focus its editing field.",
  "这是当前 PPTX 文件的实际渲染图片，仍需检查每页画面；PowerPoint / WPS 可能因字体环境而不同。": "This image is rendered from the current PPTX. Review every slide; PowerPoint / WPS may display it differently depending on installed fonts.",
  "渲染引擎报告缺失字体：": "The renderer reported missing fonts: ",
  "。请替换为目标电脑可用字体后重新渲染。": ". Choose fonts available on the target computer and render again.",
  "编辑第 ": "Edit slide ",
  " 页": "",
  "有未保存修改，请先保存或取消，再切换页面。": "You have unsaved edits. Save or cancel before switching slides.",
  "这些字段也被修改过，请比较后决定是否保存：": "These fields were changed elsewhere. Compare them before saving:",
  "最新版本：": "Latest version: ",
  "你的修改：": "Your edits: ",
  "替换图片（PNG / JPEG）": "Replace image (PNG / JPEG)",
  "添加图片（会改为图文布局）": "Add image (changes to an image-and-text layout)",
  "当前图片": "Current image",
  "已选择：": "Selected: ",
  "图片说明": "Image description",
  "图片适应方式": "Image fit",
  "完整显示": "Show complete image",
  "填满并裁切": "Fill and crop",
  "保存此页": "Save slide",
  "取消修改": "Cancel edits",
  "撤销上次修改": "Undo last change",
  "质量提醒（": "Quality findings (",
  "第 ": "Slide ",
  " 页：": ": ",
  "下载最新 PPTX": "Download latest PPTX",
  "下载成品包 ZIP": "Download delivery ZIP",
  "成品包包含 PPTX、HTML 和工程文件。请先保存修改，再下载最新版本。": "The bundle includes the PPTX, HTML and project file. Save your edits before downloading the latest version.",
  "下载 HTML": "Download HTML",
  "备份工程": "Back up project",
  "快捷键：Ctrl/⌘+S 保存 · Esc 取消或返回 · Alt+←/→ 切换页面": "Shortcuts: Ctrl/⌘+S save · Esc cancel or go back · Alt+←/→ switch slides",
  "未保存": "Unsaved",
  "有未保存修改，确定取消吗？": "Discard unsaved changes?",
  "已取消未保存的修改。": "Unsaved changes discarded.",
  "有未保存修改，离开页面会丢失。": "You have unsaved changes that will be lost.",
  "重试": "Retry",
  "复制示例": "Copy example",
  "已复制示例": "Example copied",
  "演示文稿": "Presentations",
  "模板": "Templates",
  "模板库": "Template library"
});
function languageOf(locale = localeService) {
  try { return String(locale?.getSnapshot?.().active || '').startsWith('en') ? 'en' : 'zh'; } catch { return 'zh'; }
}
function t(zh) { return languageOf() === 'en' ? (EN[zh] ?? zh) : zh; }
function englishError(message, status) {
  if (status === 401) return 'Your session has expired. Reopen DSH and try again.';
  if (status === 404) return 'The presentation workbench is unavailable. Check that the plugin is loaded and restart DSH.';
  if (status === 409) return 'The project changed. Load the latest version and review your edits before saving.';
  return /[\u3400-\u9fff]/.test(message || '') ? 'The operation failed. Check the project files and DSH logs, then retry.' : message;
}
function useLanguage(locale) {
  const [, rerender] = useState(0);
  useEffect(() => { const update = () => rerender(n => n + 1); update(); return locale?.subscribe?.(update); }, [locale]);
}

  const ROUTE = 'api/dsh-ppt/workbench';
  const fields = [['title', '标题'], ['subtitle', '副标题'], ['kicker', '眉题'], ['text', '正文'], ['bullets', '要点（每行一条）'], ['notes', '演讲备注']];
  const css = `
  .pptw {--fg:var(--dsw-alias-label-primary,#27354b);--fg-muted:var(--dsw-alias-label-tertiary,#66768a);--bg:var(--dsw-alias-bg-layer-1,#fff);--bg-surface:var(--dsw-alias-bg-layer-2,#fff);--border:var(--dsw-alias-border-l3,#ccd8e5);color:var(--fg);font:14px/1.6 system-ui,sans-serif;min-width:0;max-width:1140px;margin:0 auto;padding:8px}
  .pptw *{box-sizing:border-box}.pptw h2{font-size:22px;margin:0}.pptw h3{font-size:16px;margin:12px 0 6px}
  .pptw .muted{color:var(--fg-muted,#66768a);font-size:13px}.pptw .tools{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;align-items:center}
  .pptw button{font:inherit;border:1px solid var(--border,#ccd8e5);border-radius:9px;background:var(--bg-surface,#fff);color:inherit;padding:7px 12px;cursor:pointer;text-align:left;white-space:normal}
  .pptw button.primary{background:#245ee9;border-color:#245ee9;color:#fff}.pptw button:disabled{opacity:.45;cursor:default}
  .pptw input:not([type=file]),.pptw textarea,.pptw select{font:inherit;color:inherit;width:100%;background:var(--bg,#fff);border:1px solid var(--border,#c9d5e4);border-radius:8px;padding:8px 10px}
  .pptw textarea{resize:vertical}.pptw label{display:block;margin:8px 0 3px}.pptw .layout{display:grid;grid-template-columns:minmax(130px,190px) minmax(0,1fr);gap:14px}
  .pptw .pages{display:flex;flex-direction:column;gap:5px;max-height:480px;overflow:auto}.pptw .pages button[aria-current=true]{background:#245ee9;color:#fff}
  .pptw .preview{border:1px solid var(--border,#ced8e6);border-radius:12px;overflow:hidden;background:#f0f4fa;aspect-ratio:16/9;position:relative}
  .pptw iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.pptw .render-page{width:100%;display:block}
  .pptw .notice{border-radius:9px;padding:10px 12px;margin:10px 0;background:color-mix(in srgb,#5686fe 12%,var(--bg-surface));color:var(--fg);overflow-wrap:anywhere}.pptw .error{background:color-mix(in srgb,#f25a5a 14%,var(--bg-surface))}
  .pptw .card{border:1px solid var(--border,#d5dfeb);border-radius:12px;padding:12px;margin:10px 0;background:var(--bg-surface,#fff)}
  .pptw .coaching{margin-top:24px}.pptw .coaching-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}
  .pptw .coaching label.choice{display:flex;gap:8px;align-items:flex-start}.pptw .coaching input[type=checkbox]{width:auto;flex:none;margin-top:5px}
  .pptw .coaching pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;margin:6px 0}.pptw .coaching blockquote{margin:8px 0;padding-left:12px;border-left:3px solid var(--border,#ccd8e5);overflow-wrap:anywhere}
  .pptw .coaching .card{overflow-wrap:anywhere}.pptw .coaching .before-after{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .pptw .project-list{display:flex;flex-direction:column;gap:8px}.pptw .project-list button{display:block;width:100%}
  .pptw .file{font-size:12px;overflow-wrap:anywhere}.pptw .image-preview{width:100%;max-height:160px;object-fit:contain;background:#edf2f8;border-radius:8px}
  .pptw :focus-visible{outline:3px solid #78a8ff;outline-offset:2px}.pptw .dirty{color:#986114;font-size:13px}
.pptw .badge-dirty{color:#986114;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px;background:rgba(245,158,11,.14);border:1px solid rgba(245,158,11,.35);margin-left:4px}
.pptw .notice button{margin-left:8px;padding:2px 9px;border-radius:6px;border:1px solid currentColor;background:transparent;color:inherit;font-size:12px;cursor:pointer}
  [role=dialog]:has(.pptw){width:min(1200px,calc(100vw - 48px))!important;max-width:1200px!important}
  @media(max-width:700px){.pptw .layout{grid-template-columns:1fr}.pptw .pages{max-height:180px}.pptw .preview{min-height:190px}.pptw{padding:3px}
    .pptw .coaching-grid,.pptw .coaching .before-after{grid-template-columns:1fr}
    [role=dialog]:has(.pptw){width:100%!important;max-width:100%!important;flex-direction:column!important}
    [role=dialog]:has(.pptw)>nav+div{min-width:0;width:100%}
    [role=dialog]:has(.pptw)>nav+div>div:has(.pptw){padding:12px!important;min-width:0}
    [role=dialog]:has(.pptw) nav{width:100%!important;flex-basis:auto!important;border-right:0;max-height:170px;overflow:auto}
    [role=dialog]:has(.pptw) nav>div:has(>button){display:flex;flex-direction:row!important;flex-wrap:wrap;flex-shrink:0;gap:4px}
  }
  .pptw .tpl-canvas{position:relative;width:100%;aspect-ratio:16/9;container-type:size;border:1px solid var(--border,#ccd8e5);border-radius:10px;overflow:hidden;touch-action:none;user-select:none;margin:10px 0}
  .pptw .tpl-item{position:absolute;box-sizing:border-box;display:flex;align-items:center;justify-content:center;overflow:hidden;outline:1px dashed rgba(37,99,235,.45);cursor:move}
  .pptw .tpl-item[data-selected=true]{outline:2px solid #245ee9;z-index:2}
  .pptw .tpl-item img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}
  .pptw .tpl-handle{position:absolute;right:-5px;bottom:-5px;width:14px;height:14px;border-radius:3px;background:#245ee9;border:2px solid #fff;cursor:nwse-resize;pointer-events:auto;box-sizing:border-box}
  .pptw .tpl-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}
  .pptw .tpl-swatches{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 12px}
  .pptw .tpl-swatches input[type=color]{flex:none;width:44px;height:32px;padding:0}
  .pptw .tpl-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(84px,1fr));gap:8px;align-items:end}
  .pptw .tpl-list{display:flex;flex-direction:column;gap:8px}
  .pptw .tpl-saved{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;border:1px solid var(--border,#d5dfeb);border-radius:10px;padding:8px 10px}
  .pptw .tpl-saved .tools{margin:0}
  .pptw .tpl-item:focus-visible{outline:2px solid #245ee9}
  @media(max-width:700px){.pptw .tpl-row,.pptw .tpl-swatches{grid-template-columns:repeat(2,minmax(0,1fr))}}`;

  async function action(body, signal) {
    const response = await fetch(new URL(ROUTE, document.baseURI), { method: 'POST', credentials: 'same-origin', signal,
      headers: { 'content-type': 'application/json', 'x-dsh-ppt-action': '1' }, body: JSON.stringify(body) });
    let value;
    try { value = await response.json(); } catch { throw new Error(t("无法读取服务响应，请检查插件是否加载")) }
    if (!response.ok || value.ok === false) { const localized = languageOf() === 'en' ? value.messageEn || englishError(value.message, response.status) : value.message; const hint = languageOf() === 'en' ? value.installationHintEn : value.installationHint; const error = new Error((localized || t("操作未完成")) + (hint ? '\n' + hint : '')); error.status = response.status; throw error; }
    return value;
  }
  function draftFor(slide) {
    const source={...slide,...slide.dataTemplate};
    return { title: source.title || '', subtitle: source.subtitle || '', kicker: source.kicker || '', text: source.text || '',
      bullets: (source.bullets || []).join('\n'), notes: source.notes || '' };
  }
  function editorHtml(html, nonce) {
    const bridge = `<style>#hud,#delivery-bar,#review-panel,#progress,#notes-panel,#help-panel,#toast,#blank{display:none!important}.slide-frame{pointer-events:none!important}.slide-frame .slide{pointer-events:auto!important}</style><script>(function(){const nonce=${JSON.stringify(nonce)};
      function tell(field){parent.postMessage({type:'dsh-ppt-select',nonce:nonce,field:field},'*')}
      document.addEventListener('keydown',function(e){
        if(e.target.closest('#data-panel'))return;
        var mod=e.ctrlKey||e.metaKey;
        if(mod&&(e.key==='s'||e.key==='S')){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'dsh-ppt-shortcut',nonce:nonce,key:'save'},'*');return}
        if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'dsh-ppt-shortcut',nonce:nonce,key:'escape'},'*');return}
        if(e.altKey&&(e.key==='ArrowLeft'||e.key==='ArrowRight')){e.preventDefault();e.stopImmediatePropagation();parent.postMessage({type:'dsh-ppt-shortcut',nonce:nonce,key:e.key==='ArrowLeft'?'prev':'next'},'*');return}
        e.stopImmediatePropagation();if(e.key!=='Tab')e.preventDefault()
      },true);
      document.addEventListener('touchstart',function(e){e.stopImmediatePropagation()},true);
      document.addEventListener('touchend',function(e){e.stopImmediatePropagation()},true);
      document.addEventListener('wheel',function(e){e.stopImmediatePropagation()},{capture:true,passive:true});
      document.addEventListener('click',function(e){if(e.target.closest('#data-panel,.data-number,.data-chart-trace'))return;const n=e.target.closest('h1,h2,.subtitle,.kicker,.statement-title,.quote-text,.quote-attr,li');if(!n)return;
        e.preventDefault();e.stopImmediatePropagation();let field=n.matches('li')?'bullets':n.matches('.subtitle,.quote-attr')?'subtitle':n.matches('.kicker')?'kicker':'title';tell(field)},true);
      window.addEventListener('message',function(e){if(e.source!==parent||e.data?.nonce!==nonce)return;if(e.data.type==='dsh-ppt-jump')window.__dshPpt?.jump(e.data.page);if(e.data.type==='dsh-ppt-data-set'&&window.__dshData){window.__dshData.setParameters(e.data.parameters);const state=window.__dshData.getState();parent.postMessage({type:'dsh-ppt-data',nonce,parameters:e.data.parameters,valid:state.valid,command:e.data.command},'*')}});
      if(window.__dshData)window.__dshData.onChange=function(parameters,dirty,valid){parent.postMessage({type:'dsh-ppt-data',nonce,parameters,dirty,valid},'*')};
    })();<\/script>`;
    const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; font-src data:; connect-src 'none'; form-action 'none'">`;
    // Presenter code contains a quoted </body>; only append at the document end.
    return html.replace(/<head>/i, '<head>' + policy).replace(/<\/body>(\s*<\/html>\s*)$/i, bridge + '</body>$1');
  }
  function createImageLoader() {
    let current = null;
    function cancel() {
      const reader = current; current = null;
      if (reader?.readyState === 1) reader.abort();
    }
    return {
      cancel,
      get pending() { return current !== null; },
      read(file, success, failure) {
        cancel(); const reader = new FileReader(); current = reader;
        const settle = callback => { if (current !== reader) return; current = null; callback(); };
        reader.onload = () => settle(() => success(String(reader.result)));
        reader.onerror = () => settle(failure);
        reader.onabort = () => { if (current === reader) current = null; };
        try { reader.readAsDataURL(file); } catch { settle(failure); }
      },
    };
  }
  function modelRouteKey(model) { return JSON.stringify([model.provider, model.model]); }
  function findModelRoute(models, key) { return key ? models.find(model => modelRouteKey(model) === key) : undefined; }
  function reconcileModelRoute(models, selected, preferred) {
    if (selected) return findModelRoute(models, selected) ? selected : '';
    const key = preferred ? modelRouteKey(preferred) : '';
    return findModelRoute(models, key) ? key : '';
  }
  function CoachingPanel({ project, selected, blocked, onAdopt, onChoose }) {
    const L = (zh, en) => languageOf() === 'en' ? en : zh;
    const [mode, setMode] = useState(''), [routes, setRoutes] = useState([]), [route, setRoute] = useState('');
    const [difficulty, setDifficulty] = useState('normal'), [audience, setAudience] = useState('general'), [limit, setLimit] = useState(1);
    const [scope, setScope] = useState('all'), [material, setMaterial] = useState(''), [run, setRun] = useState(null), [history, setHistory] = useState([]);
    const [answer, setAnswer] = useState(''), [patches, setPatches] = useState([]), [backups, setBackups] = useState([]);
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const active = useRef(null), alive = useRef(true), current = useRef(null), runRef = useRef(null), reading = useRef(0), routeInitialized = useRef(false);
    current.current = { project, selected, blocked }; runRef.current = run;
    const stale = !!run && (run.stale || run.revision !== project.revision);
    const maxCalls = mode === 'review' ? limit : limit + 1;
    const modeName = value => value === 'review' ? L('AI 预审', 'AI review') : L('模拟答辩', 'Rehearsal');
    const statusName = value => ({ ready: L('等待下一步', 'Ready'), busy: L('正在调用模型', 'Calling model'), paused: L('已暂停', 'Paused'), complete: L('已结束', 'Finished') })[value] || value;
    const kindName = value => ({ expression: L('表达建议', 'Expression'), logic: L('逻辑问题', 'Logic'), evidence: L('证据缺口', 'Missing evidence') })[value];
    function accept(value) { if (alive.current) { runRef.current = value; setRun(value); } }
    const request = (operation, data = {}, signal) => action({ operation: 'coach-' + operation, id: current.current.project.id, expectedRevision: current.current.project.revision, ...data }, signal);
    async function refresh(signal) { const value = await request('list', {}, signal); if (alive.current) setHistory(value.runs); }
    useEffect(() => {
      alive.current = true;
      return () => {
        alive.current = false; reading.current++;
        if (active.current) {
          active.current.abort();
          const item = runRef.current;
          if (item) void request('stop', { runId: item.id }).catch(() => {});
        }
      };
    }, []);
    useEffect(() => {
      if (!run || run.status !== 'busy' || busy) return;
      const controller = new AbortController();
      const timer = setInterval(() => { void request('get', { runId: run.id }, controller.signal).then(value => { if (!controller.signal.aborted) accept(value.run); }).catch(() => {}); }, 750);
      return () => { clearInterval(timer); controller.abort(); };
    }, [run?.id, run?.status, busy]);
    async function task(work) {
      if (active.current) return;
      const controller = new AbortController(); active.current = controller;
      setBusy(true); setError(''); setNotice('');
      try { await work(controller.signal); }
      catch (e) {
        if (!alive.current) return;
        if (!controller.signal.aborted) setError(e.message || L('操作失败', 'Operation failed'));
        const item = runRef.current;
        if (item) { try { accept((await request('get', { runId: item.id })).run); } catch { /* Keep visible results. */ } }
      } finally {
        if (active.current === controller) active.current = null;
        if (alive.current) setBusy(false);
      }
    }
    function configure(value) {
      if (active.current || !canLeave()) return;
      setMode(value); setLimit(value === 'review' ? 1 : 3); accept(null); setPatches([]); setBackups([]); setAnswer('');
      return task(async signal => {
        const results = await Promise.allSettled([request('options', {}, signal), refresh(signal)]);
        if (signal.aborted || !alive.current) return;
        const available = results[0];
        if (available.status === 'rejected') throw available.reason;
        const models = available.value.routes;
        setRoutes(models);
        const preferred = routeInitialized.current ? undefined : project.modelRoute;
        routeInitialized.current = true;
        setRoute(value => reconcileModelRoute(models, value, preferred));
        if (!models.length) setNotice(L('先在 DSH 的模型设置中配置可用模型，再点“刷新模型”。成品仍可直接下载。', 'Configure a model in DSH, then refresh models. Your finished files remain available.'));
        if (results[1].status === 'rejected') throw results[1].reason;
      });
    }
    function canLeave() {
      const item = runRef.current, question = item?.questions.at(-1);
      return !(item?.mode === 'practice' && question && !question.feedback && answer.trim() && answer.trim() !== (question.answer || '')) || window.confirm(L('当前回答尚未提交，离开会丢失。继续吗？', 'Your answer has not been submitted and will be lost. Continue?'));
    }
    async function advance(item, signal, response) {
      let next = (await request('step', { runId: item.id, confirmed: true, ...(response === undefined ? {} : { answer: response }) }, signal)).run;
      accept(next);
      // Only this explicit Start click authorizes the configured review rounds.
      while (next.mode === 'review' && next.status === 'ready' && !next.stale && !signal.aborted && current.current.project.revision === next.revision) {
        next = (await request('step', { runId: next.id, confirmed: true }, signal)).run; accept(next);
      }
      await refresh(signal);
      if (alive.current && response !== undefined) setAnswer('');
    }
    function start() {
      if (current.current.blocked) return;
      return task(async signal => {
        const model = findModelRoute(routes, route); if (!model) throw new Error(L('请选择模型', 'Choose a model'));
        reading.current++;
        const item = (await request('create', { confirmed: true, mode, ...model, difficulty, audience, limit, material,
          language: languageOf(), ...(scope === 'current' ? { slideId: current.current.selected } : {}) }, signal)).run;
        accept(item); await advance(item, signal);
      });
    }
    function stop() {
      active.current?.abort();
      if (runRef.current) void request('stop', { runId: runRef.current.id }).then(value => accept(value.run)).catch(e => { if (alive.current) setError(e.message); });
      setNotice(L('已请求停止。已完成的结果保留，本次调用仍可能计费。', 'Stop requested. Completed results are kept; the current call may still be billed.'));
    }
    function finish() { return task(async signal => { accept((await request('finish', { runId: run.id }, signal)).run); await refresh(signal); }); }
    function openReport(id) { if (!canLeave()) return; return task(async signal => { const value = (await request('get', { runId: id }, signal)).run; accept(value); setMode(value.mode); setAnswer(value.questions.at(-1)?.answer || ''); setPatches([]); setBackups([]); }); }
    function removeReport() {
      if (!window.confirm(L('删除这次本地演练记录？幻灯片成品不受影响。', 'Delete this local rehearsal record? Presentation files are kept.'))) return;
      return task(async signal => { await request('delete', { runId: run.id }, signal); accept(null); await refresh(signal); });
    }
    function exportReport() {
      const url = new URL('api/dsh-ppt/download', document.baseURI);
      for (const [key, value] of Object.entries({ id: project.id, kind: 'coaching', revision: project.revision, run: run.id })) url.searchParams.set(key, String(value));
      const link = document.createElement('a'); link.href = url.href; link.download = ''; link.hidden = true; document.body.append(link); link.click(); link.remove();
    }
    function applySelected() {
      if (current.current.blocked || stale) return;
      return task(async signal => {
        const value = await request('apply', { runId: run.id, confirmed: true, selected: patches, backup: backups }, signal);
        if (alive.current) onAdopt(value.project);
      });
    }
    async function uploadMaterial(event) {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      const ticket = ++reading.current;
      if (!/\.(txt|md)$/i.test(file.name) || file.size > 100000) { setError(L('请选择 100 KB 以内的 TXT / Markdown 文件。', 'Choose a TXT / Markdown file up to 100 KB.')); return; }
      try {
        const value = await file.text();
        if (!alive.current || ticket !== reading.current) return;
        if (value.length > 20000) throw new Error(L('补充材料最多 20000 字符。', 'Supporting material: up to 20,000 characters.'));
        setMaterial(value); setError('');
      } catch (e) { if (alive.current && ticket === reading.current) setError(e.message); }
    }
    function toggle(set, values, id) { set(values.includes(id) ? values.filter(v => v !== id) : [...values, id]); }
    function pageButton(id) {
      const index = project.slides.findIndex(s => s.id === id);
      return h('button', { disabled: blocked || index < 0, onClick: () => onChoose(id) }, L('查看第 ' + (index + 1) + ' 页', 'View slide ' + (index + 1)));
    }
    function source(card) { return card.reference ? h('blockquote', null, h('small', { className: 'muted' }, card.reference === 'material' ? L('补充材料中的原文', 'Quote from supporting material') : L('幻灯片中的原文', 'Quote from slides')), h('pre', null, card.quote)) : h('p', { className: 'muted' }, L('未匹配到材料原文，请核对或补充依据。', 'No matching source quote. Verify or add supporting evidence.')); }
    const last = run?.questions.at(-1);
    useEffect(() => {
      if (!last || last.feedback || !answer.trim() || answer.trim() === (last.answer || '')) return;
      const warn = event => { event.preventDefault(); event.returnValue = ''; };
      window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
    }, [run?.id, last?.id, last?.feedback, last?.answer, answer]);
    return h('section', { className: 'card coaching', 'aria-label': L('可选演练', 'Optional rehearsal'), onKeyDown: e => { if (e.key === 'Escape' || (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.stopPropagation(); if (e.key.toLowerCase() === 's') e.preventDefault(); } } },
      h('h3', null, L('想再准备充分一点？', 'Want to prepare further?')),
      h('p', { className: 'muted' }, L('成品已可下载。以下两项按需开启，不影响直接交付。', 'Your files are ready to download. Both options below are optional.')),
      h('div', { className: 'tools' }, h('button', { disabled: busy, 'aria-pressed': mode === 'review', onClick: () => configure('review') }, L('AI 预审', 'AI review')), h('button', { disabled: busy, 'aria-pressed': mode === 'practice', onClick: () => configure('practice') }, L('模拟答辩', 'Rehearsal')),
        mode && h('button', { disabled: busy, onClick: () => { if (canLeave()) { setMode(''); accept(null); setAnswer(''); } } }, L('收起', 'Collapse'))),
      mode && h(React.Fragment, null,
        error && h('div', { role: 'alert', className: 'notice error' }, error),
        notice && h('div', { role: 'status', className: 'notice' }, notice),
        busy && h('div', { role: 'status', className: 'tools' }, L('正在处理…可以继续预览或下载成品。', 'Working… You can still preview or download your presentation.'), h('button', { onClick: stop }, L('停止', 'Stop'))),
        !run && h(React.Fragment, null,
          h('p', null, mode === 'review' ? L('AI 根据材料模拟质疑与回答，最多保留 5 个值得改进的问题。', 'AI simulates questions and answers based on your material, keeping up to five useful findings.') : L('AI 一次问一题，你来回答；可随时结束并整理已完成的问答。', 'AI asks one question at a time. You answer and can finish at any point.')),
          h('div', { className: 'coaching-grid' },
            h('label', null, L('模型', 'Model'), h('select', { 'aria-label': L('演练模型', 'Rehearsal model'), value: route, disabled: busy, onChange: e => setRoute(e.target.value) }, h('option', { value: '' }, routes.length ? L('请选择模型', 'Choose a model') : L('暂无可用模型', 'No configured model')), routes.map(r => h('option', { key: modelRouteKey(r), value: modelRouteKey(r) }, r.label)))),
            h('label', null, L('听众', 'Audience'), h('select', { 'aria-label': L('听众', 'Audience'), value: audience, disabled: busy, onChange: e => setAudience(e.target.value) }, [['general', L('一般听众', 'General audience')], ['management', L('管理层 / 客户', 'Management / clients')], ['academic', L('答辩评委', 'Academic panel')]].map(([v, label]) => h('option', { key: v, value: v }, label)))),
            h('label', null, L('提问强度', 'Difficulty'), h('select', { 'aria-label': L('提问强度', 'Difficulty'), value: difficulty, disabled: busy, onChange: e => setDifficulty(e.target.value) }, [['gentle', L('温和', 'Gentle')], ['normal', L('普通', 'Normal')], ['strict', L('严格', 'Strict')]].map(([v, label]) => h('option', { key: v, value: v }, label)))),
            h('label', null, mode === 'review' ? L('预审轮数', 'Review rounds') : L('答辩题数', 'Questions'), h('select', { 'aria-label': mode === 'review' ? L('预审轮数', 'Review rounds') : L('答辩题数', 'Questions'), value: limit, disabled: busy, onChange: e => setLimit(Number(e.target.value)) }, Array.from({ length: mode === 'review' ? 3 : 5 }, (_, i) => h('option', { key: i, value: i + 1 }, String(i + 1))))),
            h('label', null, L('检查范围', 'Scope'), h('select', { 'aria-label': L('检查范围', 'Scope'), value: scope, disabled: busy, onChange: e => setScope(e.target.value) }, h('option', { value: 'all' }, L('整个工程', 'Whole presentation')), h('option', { value: 'current' }, L('当前页', 'Current slide'))))),
          h('label', { htmlFor: 'ppt-coach-material' }, L('补充材料（可选）', 'Supporting material (optional)')),
          h('textarea', { id: 'ppt-coach-material', rows: 3, maxLength: 20000, value: material, disabled: busy, onChange: e => { reading.current++; setMaterial(e.target.value); } }),
          h('label', null, L('或导入 TXT / Markdown', 'Or import TXT / Markdown'), h('input', { type: 'file', accept: '.txt,.md,text/plain,text/markdown', disabled: busy, onChange: uploadMaterial })),
          h('p', { className: 'muted' }, L('将所选页面的文字、图表数据、备注及补充材料发送给所选 DSH 模型，不发送图片文件。最多 ' + maxCalls + ' 次插件调用；模型服务自身的重试与计费规则仍适用。', 'Sends selected slide text, chart data, notes and supporting material to the chosen DSH model. Image files are excluded. Up to ' + maxCalls + ' plugin calls; provider retry and billing rules still apply.')),
          h('div', { className: 'tools' }, h('button', { disabled: busy || blocked || !findModelRoute(routes, route), onClick: start }, mode === 'review' ? L('开始 AI 预审', 'Start AI review') : L('开始模拟答辩', 'Start rehearsal')), h('button', { disabled: busy, onClick: () => configure(mode) }, L('刷新模型', 'Refresh models'))),
          blocked && h('p', { className: 'muted' }, L('请先保存或取消幻灯片修改。', 'Save or cancel slide edits first.'))),
        run && h(React.Fragment, null,
          h('h3', null, modeName(run.mode) + ' · ' + statusName(run.status)),
          h('p', { className: 'muted' }, L('修订 ', 'Revision ') + run.revision + ' · ' + run.route.provider + ' / ' + run.route.model + ' · ' + L('调用 ', 'Calls ') + run.usedCalls + '/' + run.maxCalls),
          h('p', { className: 'muted' }, L('AI 意见不等于事实核验，也不代表真实听众的评价。请先看原文与改动，再决定是否采纳。', 'AI suggestions are not fact checks or predictions of audience feedback. Compare sources and edits before adopting them.')),
          stale && h('div', { role: 'alert', className: 'notice' }, L('工程已经修改。旧报告仍可导出，但不能继续调用或采纳；请重新开始。', 'The presentation changed. You can export this report, but cannot continue or apply it. Start a new rehearsal.')),
          run.error && h('p', { className: 'muted' }, languageOf() === 'en' ? run.error.split(' / ').at(-1) : run.error.split(' / ')[0]),
          run.findings.map(f => {
            const slide = project.slides.find(s => s.id === f.slideId);
            return h('article', { key: f.id, className: 'card' }, h('strong', null, kindName(f.kind) + ' · ' + f.issue), h('div', { className: 'tools' }, pageButton(f.slideId)),
              h('p', null, f.question), h('p', null, f.answer), h('p', null, f.suggestion), source(f),
              f.patch && h(React.Fragment, null, h('details', null, h('summary', null, L('比较原文和建议', 'Compare before and after')), Object.entries(f.patch).map(([key, value]) => h('div', { key }, h('strong', null, t(fields.find(([name]) => name === key)?.[1] || key)), h('div', { className: 'before-after' }, h('div', null, h('small', null, L('原文', 'Before')), h('pre', null, Array.isArray(slide?.[key]) ? slide[key].join('\n') : slide?.[key] || '')), h('div', null, h('small', null, L('建议', 'After')), h('pre', null, Array.isArray(value) ? value.join('\n') : value)))))),
                h('label', { className: 'choice' }, h('input', { type: 'checkbox', disabled: busy || stale, checked: patches.includes(f.id), onChange: () => toggle(setPatches, patches, f.id) }), L('采纳这项表达修改', 'Adopt this expression edit'))),
              h('label', { className: 'choice' }, h('input', { type: 'checkbox', disabled: busy || stale, checked: backups.includes(f.id), onChange: () => toggle(setBackups, backups, f.id) }), L('选为备用问答页', 'Add as a backup Q&A slide')));
          }),
          run.mode === 'review' && run.status === 'complete' && !run.findings.length && h('p', null, L('本次未提出明显问题。仍建议检查事实、字体和最终 PPTX。', 'No findings this time. Still check facts, fonts and the final PPTX.')),
          run.questions.map((q, i) => h('article', { key: q.id, className: 'card' }, h('strong', null, (i + 1) + '. ' + q.question), h('div', { className: 'tools' }, pageButton(q.slideId)), q.answer && h('p', null, L('你的回答：', 'Your answer: ') + q.answer), q.feedback && h('p', null, q.feedback), q.needsEvidence && h('p', { className: 'muted' }, L('待补充依据', 'Evidence needed')), source(q),
            q.answer && h('label', { className: 'choice' }, h('input', { type: 'checkbox', disabled: busy || stale, checked: backups.includes(q.id), onChange: () => toggle(setBackups, backups, q.id) }), L('选为备用问答页', 'Add as a backup Q&A slide')))),
          run.mode === 'practice' && last && !last.feedback && run.status !== 'complete' && !stale && h(React.Fragment, null,
            h('label', { htmlFor: 'ppt-coach-answer' }, L('你的回答', 'Your answer')), h('textarea', { id: 'ppt-coach-answer', maxLength: 4000, rows: 4, value: answer, disabled: busy, onChange: e => setAnswer(e.target.value) }),
            h('button', { disabled: busy || blocked || !answer.trim() || run.usedCalls >= run.maxCalls, onClick: () => task(signal => advance(run, signal, answer)) }, L('提交回答，继续', 'Submit answer and continue'))),
          h('div', { className: 'tools' }, h('button', { disabled: busy, onClick: exportReport }, L('下载问答与材料清单', 'Download Q&A and evidence checklist')),
            h('button', { disabled: busy || blocked || stale || !(patches.length + backups.length), onClick: applySelected }, L('将所选内容保存为副本', 'Save selected changes as a copy')),
            run.status !== 'complete' && h('button', { disabled: busy || run.status === 'busy', onClick: finish }, L('结束并整理已有结果', 'Finish with current results')),
            h('button', { disabled: busy, onClick: () => configure(run.mode) }, L('重新开始', 'Start again')),
            h('button', { disabled: busy || run.status === 'busy', onClick: removeReport }, L('删除本次记录', 'Delete this record'))),
          h('p', { className: 'muted' }, L('采纳后会生成新副本，原稿保留；副本中可“撤销上次修改”。备用页包含 AI 演练标记，请核对后再对外展示。', 'Adoption creates a copy and keeps the original. Undo last change also works in the copy. Backup slides identify AI rehearsal content; verify before presenting.'))),
        history.length > 0 && h('details', null, h('summary', null, L('本机历史记录（', 'Local history (') + history.length + L('）', ')')), h('div', { className: 'project-list' }, history.map(item => h('button', { key: item.id, disabled: busy, onClick: () => openReport(item.id) }, modeName(item.mode) + ' · ' + L('修订 ', 'Revision ') + item.revision + ' · ' + new Date(item.createdAt).toLocaleString(languageOf() === 'en' ? 'en-US' : 'zh-CN')))))));
  }
  const dataCss=`.pptw .data-workbench{margin-top:18px}.pptw .data-workbench details{margin:12px 0}.pptw .data-workbench summary{cursor:pointer;font-weight:600}.pptw .data-workbench pre,.pptw .data-workbench code{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;max-height:220px;overflow:auto}.pptw .data-input-row{margin:15px 0}.pptw .data-input-controls{display:grid;grid-template-columns:minmax(0,1fr) 115px;gap:12px;align-items:center}.pptw .data-input-controls input[type=range]{accent-color:var(--dsw-alias-brand-primary,#2563eb)}.pptw .data-before-after{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}.pptw .data-before-after pre{padding:10px;border:1px solid var(--dsw-alias-divider-default,#b8c0cc);border-radius:8px}.pptw .data-copy{display:flex;gap:8px;align-items:center}.pptw .data-copy input{width:auto}@media(max-width:640px){.pptw .data-before-after{grid-template-columns:minmax(0,1fr)}.pptw .data-input-controls{grid-template-columns:minmax(0,1fr) 100px}}`;
  function VisualPanel({ project, selected, blocked, onBusy, onAdopt }) {
    const L = (zh,en) => languageOf() === 'en' ? en : zh;
    const [expanded,setExpanded] = useState(false), [routes,setRoutes] = useState([]), [route,setRoute] = useState('');
    const [scope,setScope] = useState(project.slides.length > 12 ? 'current' : 'all'), [repairs,setRepairs] = useState(1);
    const [run,setRun] = useState(null), [history,setHistory] = useState([]), [busy,setBusy] = useState(false), [error,setError] = useState('');
    const [compare,setCompare] = useState(''), [pictures,setPictures] = useState({}), [loading,setLoading] = useState(false);
    const active=useRef(null), alive=useRef(true), current=useRef(null), runRef=useRef(null), progressVersion=useRef(0), routeInitialized=useRef(false);
    current.current={project,selected,blocked};runRef.current=run;
    const request=(op,data={},signal) => action({operation:'visual-'+op,id:current.current.project.id,expectedRevision:current.current.project.revision,...data},signal);
    const accept=value => {if(alive.current){progressVersion.current++;runRef.current=value;setRun(value);}};
    const phaseName=value => ({render:L('正在渲染实际 PPTX','Rendering the actual PPTX'),inspect:L('正在看图检查','Inspecting rendered slides'),repair:L('正在生成排版副本','Creating a formatting copy'),done:L('检查已结束','Review finished')})[value]||value;
    const failureText=value=>{const split=value.lastIndexOf(' / ');return split<0?value:L(value.slice(0,split),value.slice(split+3));};
    const actionName=a => ({'title-size':L('标题字号','Title size'),'body-size':L('正文字号','Body size'),'chart-label-size':L('图表字号','Chart label size'),'chart-horizontal':L('改为横向条形图','Use horizontal bars'),'image-contain':L('完整显示图片','Show the complete image'),'split-bullets':L('拆分要点页','Split bullet slide'),'split-table':L('拆分表格页','Split table slide')})[a.type]+(a.value!==undefined?' · '+a.value:'');
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;active.current?.abort();if(runRef.current&&active.current)void request('stop',{runId:runRef.current.id}).catch(()=>{});};},[]);
    useEffect(()=>{if(!run||['complete','paused'].includes(run.status)||!busy&&run.status!=='busy')return;const abort=new AbortController(),timer=setInterval(()=>{const version=progressVersion.current;void request('get',{runId:run.id},abort.signal).then(v=>{if(!abort.signal.aborted&&version===progressVersion.current)accept(v.run);}).catch(()=>{});},1000);return()=>{clearInterval(timer);abort.abort();};},[run?.id,run?.status,busy]);
    async function refresh(signal){const value=await request('list',{},signal);if(alive.current)setHistory(value.runs);}
    async function task(work,lock=false){
      if(active.current)return;
      const controller=new AbortController();active.current=controller;setBusy(true);setError('');if(lock)onBusy(true);
      try{await work(controller.signal);}
      catch(e){if(alive.current){if(!controller.signal.aborted)setError(e.message||L('视觉检查失败','Visual review failed'));if(runRef.current)try{accept((await request('get',{runId:runRef.current.id})).run);}catch{/* Keep the last checkpoint. */}}}
      finally{if(active.current===controller)active.current=null;if(alive.current)setBusy(false);if(lock)onBusy(false);}
    }
    function configure(){setExpanded(true);return task(async signal=>{
      const results=await Promise.allSettled([request('options',{},signal),refresh(signal)]);
      if(results[0].status==='rejected')throw results[0].reason;
      if(signal.aborted||!alive.current)return;
      const models=results[0].value.routes;setRoutes(models);
      const preferred=routeInitialized.current?undefined:project.modelRoute;routeInitialized.current=true;
      setRoute(value=>reconcileModelRoute(models,value,preferred));
      if(results[1].status==='rejected')throw results[1].reason;
    });}
    function start(){if(current.current.blocked)return;return task(async signal=>{
      const model=findModelRoute(routes,route);if(!model)throw new Error(L('请选择支持图片输入的模型','Choose an image-capable model'));
      let value=(await request('create',{confirmed:true,...model,repairs,language:languageOf(),...(scope==='current'?{slideId:current.current.selected}:{})},signal)).run;
      accept(value);setPictures({});setCompare('');
      while(value.status==='ready'&&!signal.aborted){value=(await request('step',{runId:value.id,confirmed:true},signal)).run;accept(value);}
      await refresh(signal);
      const last=value.rounds.at(-1);if(alive.current&&last?.rendered)setCompare(last.ids[0]);
    },true);}
    function stop(){active.current?.abort();if(runRef.current)void request('stop',{runId:runRef.current.id}).then(value=>accept(value.run)).catch(e=>{if(alive.current)setError(e.message);});}
    function open(id){return task(async signal=>{const value=(await request('get',{runId:id},signal)).run;accept(value);setCompare(value.rounds.at(-1)?.rendered?value.rounds.at(-1).ids[0]:'');});}
    function adopt(){if(blocked||!run?.canAdopt)return;return task(async signal=>{const value=await request('adopt',{runId:run.id,confirmed:true},signal);if(alive.current)onAdopt(value.project);},true);}
    function remove(){if(!window.confirm(L('删除这次检查记录和预览图片？生成的 PPT 副本会保留。','Delete this review and its preview images? Presentation copies are kept.')))return;return task(async signal=>{await request('delete',{runId:run.id},signal);accept(null);setPictures({});setCompare('');await refresh(signal);});}
    function download(){const url=new URL('api/dsh-ppt/download',document.baseURI);for(const[k,v]of Object.entries({id:project.id,kind:'visual',revision:project.revision,run:run.id}))url.searchParams.set(k,String(v));const a=document.createElement('a');a.href=url.href;a.download='';document.body.append(a);a.click();a.remove();}
    useEffect(()=>{
      if(!compare||!run)return;
      const abort=new AbortController(),last=run.rounds.length-1;setPictures({});setLoading(true);
      const initial=run.rounds[0].ids.includes(compare);
      Promise.allSettled([initial?request('page',{runId:run.id,round:0,slideId:compare},abort.signal):Promise.resolve(null),request('page',{runId:run.id,round:last,slideId:compare},abort.signal)]).then(values=>{
        if(abort.signal.aborted||!alive.current)return;
        setPictures({before:values[0].status==='fulfilled'?values[0].value?.data:null,after:values[1].status==='fulfilled'?values[1].value?.data:null});
        const failed=values.find(v=>v.status==='rejected');if(failed)setError(failed.reason.message);setLoading(false);
      });return()=>abort.abort();
    },[run?.id,run?.rounds.length,compare]);
    useEffect(()=>{const last=run?.rounds.at(-1);if(!busy&&!compare&&last?.rendered)setCompare(last.ids[0]);},[run?.id,run?.rounds.length,run?.rounds.at(-1)?.rendered,busy,compare]);
    const first=run?.rounds[0],last=run?.rounds.at(-1),stale=run&&(run.stale||run.revision!==project.revision),count=scope==='all'?project.slides.length:1;
    const callCap=Array.from({length:repairs+1},(_,i)=>Math.ceil(count*2**i/2)).reduce((a,b)=>a+b,0);
    function image(src,round,label){return h('figure',{style:{margin:0,minWidth:0}},h('figcaption',null,label),src?h('div',{style:{position:'relative',lineHeight:0}},h('img',{src,alt:label,style:{width:'100%',height:'auto',display:'block'}}),(round?.findings||[]).filter(f=>f.slideId===compare).map((f,i)=>h('span',{key:i,title:f.issue,style:{position:'absolute',pointerEvents:'none',border:'2px solid #f97316',boxSizing:'border-box',left:f.box[0]*100+'%',top:f.box[1]*100+'%',width:f.box[2]*100+'%',height:f.box[3]*100+'%'}}))):h('p',{className:'muted'},round===first&&!first.ids.includes(compare)?L('此页由拆分生成，没有对应的原页画面。','This page was created by a split and has no original counterpart.'):L('画面尚未载入，请重新选择页面。','Image not loaded; select the slide again.')));}
    return h('section',{className:'card coaching','aria-label':L('视觉检查与修复','Visual review and repair')},
      h('h3',null,L('让 AI 看完成品，再修排版','Let AI inspect the finished slides and repair formatting')),
      h('p',{className:'muted'},L('可选功能。检查实际 PPTX 画面，另存修复副本，再渲染复查。原稿保留。','Optional. Inspect actual PPTX images, save a repaired copy, and render it again for rechecking. The original is kept.')),
      !expanded?h('button',{disabled:busy||blocked,onClick:configure},L('视觉检查与修复','Visual review and repair')):h(React.Fragment,null,
        error&&h('div',{role:'alert',className:'notice error'},error),
        !run&&h(React.Fragment,null,
          h('div',{className:'coaching-grid'},
            h('label',null,L('视觉模型','Vision model'),h('select',{'aria-label':L('视觉模型','Vision model'),value:route,disabled:busy,onChange:e=>setRoute(e.target.value)},h('option',{value:''},L('请选择','Choose a model')),routes.map(m=>h('option',{key:modelRouteKey(m),value:modelRouteKey(m)},m.label)))),
            h('label',null,L('检查范围','Review scope'),h('select',{'aria-label':L('视觉检查范围','Visual review scope'),value:scope,disabled:busy,onChange:e=>setScope(e.target.value)},h('option',{value:'all',disabled:project.slides.length>12},L('全部页面（最多 12 页）','All slides (up to 12)')),h('option',{value:'current'},L('当前页','Current slide')))),
            h('label',null,L('自动修复上限','Repair limit'),h('select',{'aria-label':L('自动修复上限','Repair limit'),value:repairs,disabled:busy,onChange:e=>setRepairs(Number(e.target.value))},h('option',{value:0},L('仅看图检查','Inspect only')),h('option',{value:1},L('最多修复 1 轮（推荐）','Up to 1 repair round (recommended)')),h('option',{value:2},L('最多修复 2 轮','Up to 2 repair rounds'))))),
          !routes.length&&h('p',{className:'notice'},L('未找到声明支持图片输入的模型。请在 DSH 模型设置中检查图片输入配置；普通生成和下载仍可使用。','No model declares image input. Check the image-input configuration in DSH model settings; normal creation and downloads remain available.')),
          h('p',null,L('会向所选模型发送 '+count+' 页的渲染图片和页面文字；拆页后会重新检查新增页面，最多 '+callCap+' 次模型调用。','Sends rendered images and text from '+count+' slides to the selected model. New split pages are rechecked, with up to '+callCap+' model calls.')),
          h('p',{className:'muted'},L('只调整字号、拆页、图表方向和图片裁切，不改写原文、数字或公式。可随时停止；服务商仍可能收取已发起调用的费用。','Changes font sizes, pagination, chart orientation and image cropping. Original text, numbers and formulas are preserved. You can stop at any time; calls already sent may still be billed.')),
          h('div',{className:'tools'},h('button',{className:'primary',disabled:busy||blocked||!findModelRoute(routes,route)||count>12,onClick:start},L('开始看图检查','Start visual review')),h('button',{disabled:busy,onClick:configure},L('刷新视觉模型','Refresh vision models')))),
        run&&h(React.Fragment,null,
          h('p',{role:'status'},(run.status==='paused'?L('检查已停止','Review stopped'):run.status==='ready'&&!busy?L('等待检查','Review ready'):phaseName(run.phase))+' · '+L('已调用 ','Calls ')+run.usedCalls+'/'+run.maxCalls+' · '+L('本轮已检查 ','Slides checked this pass ')+(last?.cursor||0)+'/'+(last?.ids.length||0)),
          busy&&h('button',{onClick:stop},L('停止视觉检查','Stop visual review')),
          run.error&&h('p',{role:'alert',className:'notice error'},failureText(run.error)),
          stale&&h('p',{className:'notice'},L('工程或成品已变化，旧记录可查看，但不能继续或采纳。','The project or output changed. This old record is readable, but cannot be continued or adopted.')),
          run.status==='complete'&&h('p',{className:'notice'},last.findings.length?L('复查仍有 '+last.findings.length+' 个问题，请查看标记和说明。','Recheck still found '+last.findings.length+' issues. Review the highlighted regions and notes.'):L('AI 在本次范围内未发现明显视觉问题；这是一份模型检查记录。','AI found no obvious visual issues in this scope. This is a model review record.')),
          (last?.missingFonts||[]).length>0&&h('p',{className:'notice error'},L('渲染引擎报告缺失字体：','Renderer reported missing fonts: ')+last.missingFonts.join(', ')),
          run.rounds.map((r,i)=>h('details',{key:i,open:i===run.rounds.length-1},h('summary',null,L('检查轮次 ','Inspection pass ')+i+' · '+r.cursor+'/'+r.ids.length),r.findings.map((f,j)=>h('p',{key:j},h('strong',null,(project.slides.findIndex(s=>s.id===f.slideId)>=0?L('原第 '+(project.slides.findIndex(s=>s.id===f.slideId)+1)+' 页','Original slide '+(project.slides.findIndex(s=>s.id===f.slideId)+1)):L('拆分页','Split page'))+' · '),f.issue,h('br'),h('small',{className:'muted'},f.action?actionName(f.action):L('需要人工判断','Needs manual review')))),r.applied.length>0&&h('ul',null,r.applied.map((a,j)=>h('li',{key:j},L('已应用：','Applied: ')+actionName(a)))))),
          !busy&&last?.rendered&&h(React.Fragment,null,
            h('label',null,L('查看前后画面（橙框为 AI 定位区域）','Compare images (orange boxes mark AI findings)'),h('select',{'aria-label':L('对比页面','Comparison slide'),value:compare,onChange:e=>setCompare(e.target.value)},last.ids.map((id,i)=>h('option',{value:id,key:id},String(i+1)+'. '+(project.slides.find(s=>s.id===id)?.title||L('拆分页','Split page')))))),
            loading?h('p',{role:'status'},L('正在载入画面…','Loading images…')):h('div',{className:'before-after'},image(pictures.before,first,L('原稿 · 实际 PPTX','Original · actual PPTX')),image(pictures.after,last,run.rounds.length>1?L('修复后 · 实际 PPTX','Repaired · actual PPTX'):L('本次检查画面','Reviewed image')))),
          h('div',{className:'tools'},h('button',{className:'primary',disabled:busy||blocked||!run.canAdopt||stale,onClick:adopt},last?.findings.length?L('打开修复副本（仍有待处理问题）','Open repaired copy (issues remain)'):L('采用修复副本','Use repaired copy')),h('button',{disabled:busy,onClick:download},L('下载视觉检查记录','Download visual review')),h('button',{disabled:busy||run.status==='busy',onClick:remove},L('删除检查记录','Delete review')),h('button',{disabled:busy,onClick:()=>{accept(null);setCompare('');setPictures({});configure();}},L('新建视觉检查','New visual review')))),
        !busy&&history.length>0&&h('details',null,h('summary',null,L('本机视觉检查历史','Local visual review history')),h('div',{className:'project-list'},history.map(item=>h('button',{key:item.id,onClick:()=>open(item.id)},L('修订 ','Revision ')+item.revision+' · '+new Date(item.createdAt).toLocaleString(languageOf()==='en'?'en-US':'zh-CN'))))),
        h('button',{disabled:busy,onClick:()=>setExpanded(false)},L('收起视觉检查','Collapse visual review'))));
  }
  function DataPanel({project,blocked,incoming,onParameters,onDirty,onBusy,onAdopt,onChoose,onDownload}) {
    const L=(zh,en)=>languageOf()==='en'?en:zh,model=project.dataModel;
    const baseline=Object.fromEntries(model.metrics.filter(m=>m.kind==='input').map(m=>[m.id,String(m.value)]));
    const [parameters,setParameters]=useState(baseline),[updates,setUpdates]=useState({}),[sourceId,setSourceId]=useState(model.sources[0]?.id||'');
    const [metricId,setMetricId]=useState(model.metrics[0]?.id||''),[preview,setPreview]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[valid,setValid]=useState(true),[saveAs,setSaveAs]=useState(true),[readingFile,setReadingFile]=useState(false);
    const pending=useRef(null),alive=useRef(true),reading=useRef(0),latest=useRef(''),guard=useRef(false);
    const numeric=Object.fromEntries(Object.entries(parameters).map(([id,value])=>[id,value.trim()===''?null:Number(value)]));
    const inputsValid=model.metrics.filter(m=>m.kind==='input').every(m=>typeof numeric[m.id]==='number'&&Number.isFinite(numeric[m.id])&&numeric[m.id]>=m.min&&numeric[m.id]<=m.max&&Math.abs((numeric[m.id]-m.min)/m.step-Math.round((numeric[m.id]-m.min)/m.step))<=1e-6);
    const body={parameters:numeric,sourceUpdates:Object.values(updates)},signature=JSON.stringify(body);latest.current=signature;
    const changed=readingFile||!valid||Object.entries(baseline).some(([id,value])=>Number(parameters[id])!==Number(value)||parameters[id].trim()==='')||Object.keys(updates).length>0;
    useEffect(()=>{onDirty(changed);return()=>onDirty(false);},[changed]);
    useEffect(()=>{setPreview(null);},[signature]);
    useEffect(()=>{if(incoming){setParameters(Object.fromEntries(Object.entries(incoming.parameters).map(([id,value])=>[id,Number.isFinite(value)?String(value):''])));setValid(incoming.valid!==false);}},[incoming]);
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;reading.current++;pending.current?.abort();onBusy(false);};},[]);
    function changeParameter(id,value){const next={...parameters,[id]:value};setParameters(next);setValid(true);setPreview(null);setError('');onParameters(Object.fromEntries(Object.entries(next).map(([key,raw])=>[key,raw.trim()===''?NaN:Number(raw)])));}
    function reset(){reading.current++;setParameters(baseline);setUpdates({});setPreview(null);setError('');setValid(true);onParameters(Object.fromEntries(Object.entries(baseline).map(([id,value])=>[id,Number(value)])));}
    async function task(work){
      if(guard.current||blocked||readingFile)return;guard.current=true;setBusy(true);onBusy(true);setError('');
      const controller=new AbortController();pending.current=controller;
      try{await work(controller.signal);}catch(reason){if(alive.current&&!controller.signal.aborted)setError(reason.message||L('操作失败','Operation failed'));}
      finally{pending.current=null;guard.current=false;if(alive.current){setBusy(false);onBusy(false);}}
    }
    function inspect(){const sent=signature;return task(async signal=>{const value=await action({operation:'data-preview',id:project.id,expectedRevision:project.revision,...body},signal);if(alive.current&&latest.current===sent)setPreview({...value,signature:sent});});}
    function apply(){if(!preview||preview.signature!==signature)return;const sent=signature;return task(async signal=>{const value=await action({operation:'data-apply',id:project.id,expectedRevision:project.revision,...body,confirmed:true,previewToken:preview.token,saveAs},signal);if(alive.current&&latest.current===sent){onDirty(false);onAdopt(value.project);}});}
    async function importSource(event){
      const file=event.target.files?.[0];event.target.value='';if(!file)return;const stamp=++reading.current,target=sourceId;
      if(file.size>1024*1024||!['csv','tsv','txt','md'].includes(file.name.split('.').at(-1)?.toLowerCase())){setError(L('请选择 1 MiB 内的 CSV、TSV、TXT 或 Markdown。','Choose CSV, TSV, TXT or Markdown up to 1 MiB.'));return;}
      setReadingFile(true);try{const content=await file.text();if(!alive.current||stamp!==reading.current)return;const ext=file.name.split('.').at(-1).toLowerCase();setUpdates(old=>({...old,[target]:{id:target,format:ext==='csv'||ext==='tsv'?ext:'text',content}}));setPreview(null);setError('');}catch{if(alive.current)setError(L('无法读取材料，请重试。','Could not read source. Try again.'));}finally{if(alive.current)setReadingFile(false);}
    }
    async function importScenario(event){
      const file=event.target.files?.[0];event.target.value='';if(!file)return;const stamp=++reading.current;
      setReadingFile(true);
      try{
        if(file.size>32000)throw new Error(L('推演参数文件过大。','Scenario parameter file is too large.'));
        const packet=JSON.parse(await file.text());if(!alive.current||stamp!==reading.current)return;
        if(packet.schemaVersion!==1||packet.deckId!==project.deckId||packet.revision!==project.revision||packet.fingerprint!==model.fingerprint||!packet.parameters||typeof packet.parameters!=='object'||Array.isArray(packet.parameters)||Object.keys(packet.parameters).some(id=>!Object.hasOwn(baseline,id))||Object.values(packet.parameters).some(value=>typeof value!=='number'||!Number.isFinite(value)))throw new Error(L('参数来自其他工程、旧版本或格式无效，请重新导出。','Scenario is stale, belongs to another project, or is invalid. Export it again.'));
        const next={...baseline,...Object.fromEntries(Object.entries(packet.parameters).map(([id,value])=>[id,String(value)]))};setParameters(next);setValid(true);setPreview(null);onParameters(Object.fromEntries(Object.entries(next).map(([id,value])=>[id,Number(value)])));setError('');
      }catch(reason){if(alive.current)setError(reason.message);}finally{if(alive.current)setReadingFile(false);}
    }
    const metric=model.metrics.find(m=>m.id===metricId),source=model.sources.find(s=>s.id===sourceId),replacement=updates[sourceId];
    const format=(value,m)=>new Intl.NumberFormat(languageOf()==='en'?'en-US':'zh-CN',{style:m.format.style==='percent'?'percent':'decimal',minimumFractionDigits:m.format.digits,maximumFractionDigits:m.format.digits}).format(value)+(m.format.unit||'');
    const display=value=>typeof value==='string'?value:JSON.stringify(value,null,2),disabled=busy||blocked||readingFile;
    return h('section',{className:'card data-workbench','aria-label':L('数据溯源与现场推演','Data lineage and what-if')},
      h('style',null,dataCss),
      h('h3',null,L('数据溯源与现场推演','Data lineage and what-if')),
      h('p',{className:'muted'},L('点预览中的数字可追问来源。只有明确声明的假设可调；来源不等于事实已核验。','Click numbers in the preview to inspect their lineage. Only declared assumptions are adjustable. Lineage is not factual verification.')),
      h('details',null,h('summary',null,L('数字来自哪里','Where the numbers come from')),
        h('label',null,L('指标','Metric'),h('select',{value:metricId,disabled,onChange:event=>setMetricId(event.target.value)},model.metrics.map(m=>h('option',{key:m.id,value:m.id},m.label+' ['+m.id+']')))),
        metric&&h('div',{className:'data-evidence'},h('strong',null,metric.label+' = '+format(model.values[metric.id],metric)),
          metric.kind==='source'?h(React.Fragment,null,h('p',null,metric.evidence.name+' · '+metric.evidence.locator),h('pre',null,metric.evidence.excerpt),h('details',null,h('summary',null,L('来源快照校验值','Source snapshot checksum')),h('code',null,metric.evidence.sha256))):metric.kind==='input'?h('p',null,L('用户假设','User assumption')+(metric.note?' · '+metric.note:'')):h(React.Fragment,null,h('pre',null,'= '+metric.formula),h('div',{className:'tools'},metric.dependencies.map(id=>h('button',{key:id,disabled,onClick:()=>setMetricId(id)},model.metrics.find(m=>m.id===id).label))))),
        h('button',{disabled:disabled||changed,onClick:()=>onDownload('data')},L('下载溯源与假设报告','Download lineage and assumptions'))),
      model.metrics.some(m=>m.kind==='input')&&h('details',{open:true},h('summary',null,L('现场推演参数','What-if assumptions')),
        model.metrics.filter(m=>m.kind==='input').map(m=>h('div',{key:m.id,className:'data-input-row'},h('label',{htmlFor:'ppt-data-'+m.id},m.label,h('small',{className:'muted'},' · '+L('假设','Assumption')+(m.note?' · '+m.note:''))),h('div',{className:'data-input-controls'},h('input',{type:'range',min:m.min,max:m.max,step:m.step,value:Number(parameters[m.id]),disabled,'aria-label':m.label+' '+L('滑杆','slider'),onChange:event=>changeParameter(m.id,event.target.value)}),h('input',{id:'ppt-data-'+m.id,type:'number',min:m.min,max:m.max,step:m.step,value:parameters[m.id],disabled,onChange:event=>changeParameter(m.id,event.target.value)})))),
        h('label',null,L('导入离线 HTML 保存的推演参数','Import scenario parameters saved in offline HTML'),h('input',{type:'file',accept:'.json,application/json',disabled,onChange:importScenario}))),
      model.sources.length>0&&h('details',null,h('summary',null,L('更新来源材料','Update source material')),
        h('p',{className:'muted'},L('先导入或粘贴新材料，预览影响后再确认；不会自动监视或修改原文件。表格可从 Excel 导出 CSV。','Import or paste new material, then preview the impact before confirming. Original source files are not watched or modified. Export Excel tables as CSV.')),
        h('label',null,L('替换来源','Replace source'),h('select',{value:sourceId,disabled,onChange:event=>setSourceId(event.target.value)},model.sources.map(s=>h('option',{key:s.id,value:s.id},s.name)))),
        h('label',null,L('导入替换材料','Import replacement material'),h('input',{type:'file',accept:source?.kind==='table'?'.csv,.tsv':'.txt,.md',disabled,onChange:importSource})),
        source?.kind==='table'&&h('label',null,L('分隔格式','Delimiter format'),h('select',{value:replacement?.format||'csv',disabled,onChange:event=>{setUpdates(old=>({...old,[sourceId]:{id:sourceId,format:event.target.value,content:replacement?.content||''}}));setPreview(null);}},h('option',{value:'csv'},'CSV'),h('option',{value:'tsv'},'TSV'))),
        h('label',null,L('或粘贴内容','Or paste content'),h('textarea',{rows:4,maxLength:1048576,value:replacement?.content??'',disabled,onChange:event=>{setUpdates(old=>({...old,[sourceId]:{id:sourceId,format:source.kind==='table'?replacement?.format||'csv':'text',content:event.target.value}}));setPreview(null);setError('');}})),
        replacement&&h('button',{disabled,onClick:()=>{setUpdates(old=>{const next={...old};delete next[sourceId];return next;});setPreview(null);}},L('取消此来源更新','Cancel this source update'))),
      changed&&h('p',{className:'dirty',role:'status'},L('推演或材料尚未保存，当前 PPTX 仍是已保存版本。先预览差异并确认，或恢复参数后下载。','Unsaved scenario or source changes. The PPTX still contains saved values. Preview and confirm, or reset before downloading.')),
      (!valid||!inputsValid)&&h('p',{className:'notice error',role:'alert'},L('参数无法计算，请检查范围、步长或除零，再恢复或修改。','Cannot calculate these parameters. Check ranges, steps or division by zero; adjust or reset.')),
      error&&h('p',{className:'notice error',role:'alert'},error),
      h('div',{className:'tools'},h('button',{disabled:disabled||!changed||!valid||!inputsValid,onClick:inspect},L('预览差异','Preview changes')),h('button',{disabled:disabled||!changed,onClick:reset},L('恢复已保存数据','Reset to saved data'))),
      preview&&preview.signature===signature&&h('div',{className:'data-diff'},h('h4',null,L('确认前核对','Review before confirming')),
        !preview.changed?h('p',null,L('内容没有变化。','No content changes.')):h(React.Fragment,null,
          h('ul',null,preview.changes.map(change=>h('li',{key:change.id},h('strong',null,change.label+': '),change.beforeText+' → '+change.afterText,change.before===change.after&&' · '+L('来源已更新','Source updated')))),
          h('h4',null,L('受影响页面','Affected slides')),
          !preview.affectedSlides.length&&h('p',{className:'muted'},L('指标尚未绑定到页面，只更新数据模型。','Metrics are not bound to slides; only the data model changes.')),
          preview.affectedSlides.map(slide=>h('details',{key:slide.id},h('summary',null,(slide.page)+'. '+slide.title),h('button',{disabled,onClick:()=>onChoose(slide.id)},L('查看页面','View slide')),slide.evidenceChanged&&h('p',null,L('关联的来源快照有变化。','A linked source snapshot changed.')),slide.fields.map(field=>h('div',{key:field.field},h('strong',null,t(fields.find(([key])=>key===field.field)?.[1]||field.field)),h('div',{className:'data-before-after'},h('pre',null,L('之前：','Before: ')+display(field.before)),h('pre',null,L('之后：','After: ')+display(field.after))))))),
          h('label',{className:'data-copy'},h('input',{type:'checkbox',checked:saveAs,disabled,onChange:event=>setSaveAs(event.target.checked)}),L('保存为新副本，保留原稿（推荐）','Save a new copy and keep the original (recommended)')),
          h('p',{className:'muted'},L('PPTX 保存确认后的静态结果，并附公式、来源和假设；HTML 保留交互。JSON 工程包含导入的完整材料，分享前请检查。','PPTX saves confirmed static results with formulas, sources and assumptions; HTML retains interaction. The JSON project contains full imported material; review it before sharing.')),
          h('button',{className:'primary',disabled:disabled||!valid||!inputsValid,onClick:apply},saveAs?L('确认并保存推演副本','Confirm and save scenario copy'):L('确认并更新当前工程','Confirm and update this project')))));
  }
  const TEMPLATE_PAGES = [['cover', '封面', 'Cover'], ['section', '章节', 'Section'], ['content', '内容', 'Content'], ['closing', '结尾', 'Closing']];
  const TEMPLATE_CANVAS = { w: 13.3333, h: 7.5 };
  const TEMPLATE_PALETTE_FIELDS = [['bg', '背景', 'Background'], ['panel', '面板', 'Panel'], ['fg', '文字', 'Text'], ['muted', '次要文字', 'Muted text'], ['accent', '主色', 'Accent'], ['accent2', '辅色', 'Secondary accent']];
  const TEMPLATE_FONT_FIELDS = [['heading', '标题字体', 'Heading font'], ['body', '正文字体', 'Body font'], ['accent', '装饰字体', 'Accent font']];
  const TEMPLATE_ASSET_SLOTS = [['universityLogo', '校徽 / 单位标志', 'University logo'], ['classLogo', '班徽 / 团队标志', 'Class logo'], ['extra', '其它固定标志', 'Other fixed mark']];
  const TEMPLATE_DEFAULT_PALETTE = { bg: '#FFFFFF', panel: '#F2F5F9', fg: '#1A1A1A', muted: '#6B7785', accent: '#1F4E79', accent2: '#C9A227' };
  const TEMPLATE_BUILTIN = [
    { id: 'swiss', zh: '瑞士脉冲', en: 'Swiss Pulse', palette: { bg: '#10151B', accent: '#2F6BFF' } },
    { id: 'velvet', zh: '天鹅绒标准', en: 'Velvet Standard', palette: { bg: '#111316', accent: '#C9A84C' } },
    { id: 'data', zh: '数据漂移', en: 'Data Drift', palette: { bg: '#070B14', accent: '#7C3AED' } },
    { id: 'soft', zh: '柔和信号', en: 'Soft Signal', palette: { bg: '#FFF8EC', accent: '#E58A2F' } },
    { id: 'bold', zh: '极繁大字', en: 'Maximalist Type', palette: { bg: '#0D0D0D', accent: '#E63946' } }
  ];
  function templateName(name) {
    if (typeof name === 'string') return { zh: name, en: name };
    if (name && typeof name === 'object') return { zh: String(name.zh || name.en || ''), en: String(name.en || name.zh || '') };
    return { zh: '', en: '' };
  }
  function templateLabel(name) { const parts = templateName(name); return languageOf() === 'en' ? parts.en || parts.zh : parts.zh || parts.en; }
  function templatePalette(value) { return Object.assign({}, TEMPLATE_DEFAULT_PALETTE, value && typeof value === 'object' ? value : {}); }
  function safeColor(value) { return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value) ? value.toUpperCase() : '#000000'; }
  function templatePercent(item) {
    const raw = item && Array.isArray(item.box) && item.box.length >= 4 ? item.box.slice(0, 4).map(Number) : [1, 1, 4, 2];
    const safe = raw.map(value => Number.isFinite(value) ? value : 0);
    return [safe[0] / TEMPLATE_CANVAS.w * 100, safe[1] / TEMPLATE_CANVAS.h * 100, safe[2] / TEMPLATE_CANVAS.w * 100, safe[3] / TEMPLATE_CANVAS.h * 100];
  }
  function templateInches(box) {
    return [box[0] / 100 * TEMPLATE_CANVAS.w, box[1] / 100 * TEMPLATE_CANVAS.h, box[2] / 100 * TEMPLATE_CANVAS.w, box[3] / 100 * TEMPLATE_CANVAS.h].map(value => Math.round(value * 1000) / 1000);
  }
  function templateSlotData(value) {
    const data = typeof value === 'string' ? value : value && typeof value.data === 'string' ? value.data : '';
    if (!data) return '';
    if (/^data:image\/(png|jpeg|jpg);base64,/.test(data)) return data;
    return /^[A-Za-z0-9+/=]+$/.test(data) ? 'data:image/png;base64,' + data : '';
  }
  function templateAssetUrls(source) {
    const out = {};
    const raw = Object.assign({}, source && source.draftAssets, source && source.draft && source.draft.draftAssets, source && source.assets);
    for (const slot of Object.keys(raw)) { const url = templateSlotData(raw[slot]); if (url) out[slot] = url; }
    return out;
  }
  // Template JSON keeps inches; the canvas works in percent so dragging never depends on pixels.
  function templateDraft(template) {
    const source = template && typeof template === 'object' ? template : {};
    const chrome = {};
    for (const pageType of TEMPLATE_PAGES) {
      const type = pageType[0];
      const items = source.chrome && Array.isArray(source.chrome[type]) ? source.chrome[type].slice(0, 12) : [];
      chrome[type] = items.map(entry => {
        const item = entry && typeof entry === 'object' ? entry : {};
        const box = templatePercent(item);
        if (item.kind === 'text') return { kind: 'text', box, text: String(item.text || ''), size: Number(item.size) || 16, color: String(item.color || '#1A1A1A'), font: ['heading', 'body', 'accent'].includes(item.font) ? item.font : 'body', align: ['left', 'center', 'right'].includes(item.align) ? item.align : 'left' };
        return { kind: 'image', box, asset: String(item.asset || '') };
      });
    }
    return { schema: 'dsh-ppt/template@1', id: typeof source.id === 'string' ? source.id : '', name: templateName(source.name),
      dark: source.dark === true, palette: templatePalette(source.palette),
      fonts: Object.assign({ heading: 'Microsoft YaHei', body: 'Microsoft YaHei', accent: '' }, source.fonts && typeof source.fonts === 'object' ? source.fonts : {}),
      typeScale: Object.assign({ cover: 40, section: 40, title: 20, body: 13, caption: 10, footer: 14 }, source.typeScale && typeof source.typeScale === 'object' ? source.typeScale : {}),
      assets: Object.assign({}, source.assets && typeof source.assets === 'object' ? source.assets : {}),
      ...(source.source ? { source: source.source } : {}), chrome };
  }
  function templatePayload(draft) {
    const chrome = {};
    for (const pageType of TEMPLATE_PAGES) {
      const type = pageType[0];
      chrome[type] = draft.chrome[type].map(item => {
        const box = templateInches(item.box);
        if (item.kind === 'image') return { kind: 'image', asset: item.asset, box };
        return { kind: 'text', text: item.text, size: item.size, color: item.color, font: item.font, align: item.align, box };
      });
    }
    return { schema: 'dsh-ppt/template@1', id: draft.id, name: { zh: draft.name.zh || draft.name.en, en: draft.name.en || draft.name.zh },
      canvas: { w: TEMPLATE_CANVAS.w, h: TEMPLATE_CANVAS.h }, dark: draft.dark === true, palette: draft.palette,
      fonts: draft.fonts, typeScale: draft.typeScale, assets: draft.assets, chrome, ...(draft.source ? { source: draft.source } : {}) };
  }
  function TemplatePanel() {
    const L = (zh, en) => languageOf() === 'en' ? en : zh;
    const [expanded, setExpanded] = useState(false), [templates, setTemplates] = useState([]), [busy, setBusy] = useState(false);
    const [error, setError] = useState(''), [notice, setNotice] = useState('');
    const [draft, setDraft] = useState(null), [origin, setOrigin] = useState({ kind: 'new', id: '' });
    const [assets, setAssets] = useState({}), [page, setPage] = useState('cover'), [selected, setSelected] = useState(-1), [pickSlot, setPickSlot] = useState('');
    const alive = useRef(true), drag = useRef(null), canvas = useRef(null), baseline = useRef('');
    const snap = value => Math.round(value * 10) / 10;
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    useEffect(() => { alive.current = true; return () => { alive.current = false; drag.current = null; }; }, []);
    useEffect(() => { if (!assets[pickSlot]) setPickSlot(Object.keys(assets)[0] || ''); }, [assets, pickSlot]);
    async function task(work) {
      if (busy) return;
      setBusy(true); setError(''); setNotice('');
      try { await work(); }
      catch (reason) { if (alive.current) setError(reason && reason.message ? reason.message : L('操作失败', 'Operation failed')); }
      finally { if (alive.current) setBusy(false); }
    }
    function refresh() { return action({ operation: 'template-list' }).then(value => { if (alive.current) setTemplates(value.templates || []); }).catch(reason => { if (alive.current) setError(reason.message || L('无法读取模板列表', 'Could not read the template list.')); }); }
    function toggle() { const next = !expanded; setExpanded(next); if (next && !templates.length) void refresh(); }
    function edit(template, next, urls) {
      const clean = templateDraft(template);
      baseline.current = JSON.stringify(clean);
      setDraft(clean); setOrigin(next); setAssets(urls || {}); setPage('cover'); setSelected(-1); setError(''); setNotice('');
    }
    function closeEditor() { setDraft(null); setSelected(-1); setError(''); setNotice(''); }
    function openSaved(id) {
      return task(async () => {
        const value = await action({ operation: 'template-list', id });
        if (!value.template) throw new Error(L('模板不存在', 'Template not found'));
        edit(value.template.template, { kind: 'update', id }, templateAssetUrls(value.template));
      });
    }
    function readDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error(L('无法读取文件，请重试。', 'Could not read the file. Try again.')));
        try { reader.readAsDataURL(file); } catch (error) { reject(error); }
      });
    }
    function measure(dataUrl) {
      return new Promise(resolve => {
        if (typeof Image === 'undefined') { resolve({ width: 0, height: 0 }); return; }
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth || 0, height: image.naturalHeight || 0 });
        image.onerror = () => resolve({ width: 0, height: 0 });
        image.src = dataUrl;
      });
    }
    function importPptx(event) {
      const file = event.target.files && event.target.files[0]; event.target.value = ''; if (!file) return;
      if (!/\.pptx$/i.test(file.name)) { setError(L('请选择 .pptx 文件。', 'Choose a .pptx file.')); return; }
      if (file.size > 8 * 1024 * 1024) { setError(L('PPTX 请控制在 8 MiB 以内：面板单次请求上限为 12 MiB。', 'Keep the PPTX under 8 MiB; one panel request is capped at 12 MiB.')); return; }
      return task(async () => {
        const dataUrl = await readDataUrl(file);
        const value = await action({ operation: 'template-extract', file: dataUrl.replace(/^data:[^,]*,/, ''), filename: file.name });
        const extracted = value.draft && typeof value.draft === 'object' ? value.draft : {};
        if (!extracted.id) extracted.id = 'tpl-' + Date.now().toString(36);
        edit(extracted, { kind: 'new', id: '' }, templateAssetUrls(value));
        setNotice(Object.keys(templateAssetUrls(value)).length
          ? L('已抽取配色与固定标志，请检查摆位后保存。', 'Colors and fixed marks extracted. Check positions, then save.')
          : L('已抽取配色与文字；没有可预览的标志图片，请手动上传或重新导入。', 'Colors and text extracted. No mark images were available for preview; upload them or import again.'));
      });
    }
    function createBlank() {
      edit({ id: 'tpl-' + Date.now().toString(36), name: { zh: '', en: '' }, palette: TEMPLATE_DEFAULT_PALETTE, chrome: {} }, { kind: 'new', id: '' }, {});
      setNotice(L('填写名称与配色，上传固定标志后，用画布下方的按钮放到各页型。', 'Set the name and colors, upload fixed marks, then place them per page type with the buttons under the canvas.'));
    }
    function editItem(index, changes) {
      setDraft(current => {
        if (!current) return current;
        const items = current.chrome[page].slice();
        items[index] = Object.assign({}, items[index], changes);
        return Object.assign({}, current, { chrome: Object.assign({}, current.chrome, { [page]: items }) });
      });
    }
    function updateGeometry(index, box) { editItem(index, { box }); }
    function removeItem(index) {
      setSelected(-1);
      setDraft(current => current ? Object.assign({}, current, { chrome: Object.assign({}, current.chrome, { [page]: current.chrome[page].filter((_, i) => i !== index) }) }) : current);
    }
    function addItem(item) {
      if (!draft) return;
      if (draft.chrome[page].length >= 12) { setError(L('每个页型最多 12 个固定元素。', 'Up to 12 fixed items per page type.')); return; }
      const index = draft.chrome[page].length;
      setDraft(Object.assign({}, draft, { chrome: Object.assign({}, draft.chrome, { [page]: draft.chrome[page].concat([item]) }) }));
      setSelected(index); setError('');
    }
    function updatePalette(key, value) { setDraft(current => current ? Object.assign({}, current, { palette: Object.assign({}, current.palette, { [key]: value.toUpperCase() }) }) : current); }
    function updateFont(key, value) { setDraft(current => current ? Object.assign({}, current, { fonts: Object.assign({}, current.fonts, { [key]: value }) }) : current); }
    function updateName(key, value) { setDraft(current => current ? Object.assign({}, current, { name: Object.assign({}, current.name, { [key]: value }) }) : current); }
    function updateId(value) { setDraft(current => current ? Object.assign({}, current, { id: value }) : current); }
    function pointerPoint(event) {
      const box = canvas.current ? canvas.current.getBoundingClientRect() : null;
      if (!box || !box.width || !box.height) return null;
      return { x: (event.clientX - box.left) / box.width * 100, y: (event.clientY - box.top) / box.height * 100 };
    }
    function startDrag(event, index, mode) {
      if (!draft) return;
      if (event.button !== undefined && event.button !== 0) return;
      const point = pointerPoint(event), item = draft.chrome[page][index];
      if (!point || !item) return;
      event.preventDefault(); event.stopPropagation();
      setSelected(index);
      drag.current = { index, mode, startX: point.x, startY: point.y, origin: item.box.slice(0, 4) };
      try { event.currentTarget.setPointerCapture(event.pointerId); } catch (error) { /* Older WebViews lack pointer capture. */ }
    }
    function dragMove(event) {
      const state = drag.current; if (!state || !draft) return;
      const point = pointerPoint(event); if (!point) return;
      const dx = point.x - state.startX, dy = point.y - state.startY;
      let x = state.origin[0], y = state.origin[1], w = state.origin[2], hh = state.origin[3];
      if (state.mode === 'resize') { w = clamp(snap(w + dx), 1, 100); hh = clamp(snap(hh + dy), 1, 100); }
      else { x = snap(x + dx); y = snap(y + dy); }
      x = clamp(x, 0, 100 - w); y = clamp(y, 0, 100 - hh);
      updateGeometry(state.index, [x, y, w, hh]);
    }
    function dragEnd(event) {
      if (!drag.current) return;
      drag.current = null;
      try { event.currentTarget.releasePointerCapture(event.pointerId); } catch (error) { /* Capture may already be gone. */ }
    }
    function nudge(event, index) {
      if (!draft) return;
      const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (!delta) return;
      event.preventDefault(); event.stopPropagation();
      setSelected(index);
      const step = event.shiftKey ? 1 : 0.1, box = draft.chrome[page][index].box.slice(0, 4);
      const x = clamp(snap(box[0] + delta[0] * step), 0, 100 - box[2]);
      const y = clamp(snap(box[1] + delta[1] * step), 0, 100 - box[3]);
      updateGeometry(index, [x, y, box[2], box[3]]);
    }
    function remove(id, label) {
      if (!window.confirm(L('删除模板「', 'Delete template "') + label + L('」？模板文件会从本机删除，已生成的演示文稿不受影响。', '"? Its files are removed from this machine. Presentations already generated are not affected.'))) return;
      return task(async () => {
        await action({ operation: 'template-remove', id, confirmed: true });
        if (draft && origin.id === id) closeEditor();
        await refresh();
        if (alive.current) setNotice(L('模板已删除。', 'Template deleted.'));
      });
    }
    function save() {
      if (!draft) return;
      const name = templateName(draft.name);
      if (!name.zh && !name.en) { setError(L('请填写模板名称。', 'Enter a template name.')); return; }
      if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(draft.id)) { setError(L('模板编号需为 2–40 位小写字母、数字或连字符，且不能与内置主题同名。', 'Template id must be 2–40 lowercase letters, digits or hyphens and must not reuse a built-in theme id.')); return; }
      const payload = templatePayload(draft), icons = {};
      for (const slot of Object.keys(assets)) icons[slot] = assets[slot];
      let dropped = 0;
      if (origin.kind === 'new') {
        const available = {};
        for (const slot of Object.keys(payload.assets)) { if (icons[slot]) available[slot] = payload.assets[slot]; else dropped++; }
        payload.assets = available;
        for (const pageType of TEMPLATE_PAGES) {
          const type = pageType[0];
          payload.chrome[type] = payload.chrome[type].filter(item => item.kind !== 'image' || available[item.asset]);
        }
      }
      if (origin.kind === 'update') {
        if (JSON.stringify(draft) === baseline.current) { setNotice(L('没有需要保存的修改。', 'No changes to save.')); return; }
        const before = JSON.parse(baseline.current || '{}'), patch = {}, changed = (left, right) => JSON.stringify(left) !== JSON.stringify(right);
        if (changed(before.palette, draft.palette)) patch.palette = draft.palette;
        if (changed(templateName(before.name), name)) patch.name = payload.name;
        if (changed(before.fonts, draft.fonts)) patch.fonts = draft.fonts;
        if (changed(before.typeScale, draft.typeScale)) patch.typeScale = draft.typeScale;
        if (changed(before.chrome, draft.chrome)) patch.chrome = payload.chrome;
        if (!Object.keys(patch).length) { setNotice(L('没有需要保存的修改。', 'No changes to save.')); return; }
        return task(async () => {
          const value = await action(Object.assign({ operation: 'template-update', id: origin.id }, patch));
          if (!alive.current) return;
          edit(value.template.template, { kind: 'update', id: origin.id }, templateAssetUrls(value.template));
          setNotice(L('模板已更新，之后生成的演示文稿会使用新的位置。', 'Template updated. Presentations generated next use the new positions.'));
          await refresh();
        });
      }
      return task(async () => {
        const value = await action({ operation: 'template-save', template: payload, assets: icons });
        if (!alive.current) return;
        const detail = value.template || {};
        edit(detail.template || payload, { kind: 'update', id: draft.id }, templateAssetUrls(detail));
        setNotice(dropped ? L('模板已保存；有 ' + dropped + ' 个标志缺少图片数据，已跳过。', 'Template saved; ' + dropped + ' mark(s) without image data were skipped.') : L('模板已保存，可在生成演示文稿时选作主题。', 'Template saved. It can be used as a theme when generating presentations.'));
        await refresh();
      });
    }
    function assetUrl(slot) { return assets[slot] || ''; }
    function family(key) { return key === 'heading' ? draft.fonts.heading : key === 'accent' ? draft.fonts.accent || draft.fonts.heading : draft.fonts.body; }
    function itemNode(item, index) {
      const selectedNow = index === selected;
      const style = { left: item.box[0] + '%', top: item.box[1] + '%', width: item.box[2] + '%', height: item.box[3] + '%' };
      const label = item.kind === 'text' ? item.text : item.asset;
      const inner = item.kind === 'text'
        ? h('div', { style: { width: '100%', height: '100%', overflow: 'hidden', color: safeColor(item.color), textAlign: item.align, fontSize: (item.size / 540 * 100) + 'cqh', lineHeight: 1.15, fontFamily: family(item.font), whiteSpace: 'pre-wrap' } }, item.text)
        : assetUrl(item.asset)
          ? h('img', { src: assetUrl(item.asset), alt: '' })
          : h('span', { className: 'muted', style: { fontSize: '11px', textAlign: 'center' } }, item.asset || L('未命名标志', 'Unnamed mark'));
      return h('div', { key: index, className: 'tpl-item', 'data-selected': selectedNow ? 'true' : 'false', style, tabIndex: 0, role: 'group',
        'aria-label': label + ' ' + (index + 1), onPointerDown: event => startDrag(event, index, 'move'), onPointerMove: dragMove,
        onPointerUp: dragEnd, onPointerCancel: dragEnd, onKeyDown: event => nudge(event, index),
        onClick: event => { event.stopPropagation(); setSelected(index); } },
        inner,
        selectedNow && h('span', { className: 'tpl-handle', title: L('拖动缩放', 'Drag to resize'), onPointerDown: event => startDrag(event, index, 'resize'), onPointerMove: dragMove, onPointerUp: dragEnd, onPointerCancel: dragEnd }));
    }
    function listView() {
      return h(React.Fragment, null,
        h('div', { className: 'tools', style: { alignItems: 'flex-end' } },
          h('label', { style: { margin: 0 } }, L('导入模板（.pptx）', 'Import template (.pptx)'), h('input', { type: 'file', accept: '.pptx', disabled: busy, onChange: importPptx })),
          h('button', { disabled: busy, onClick: createBlank }, L('手动创建模板', 'Create template manually')),
          h('button', { disabled: busy, onClick: () => task(refresh) }, L('刷新列表', 'Refresh list'))),
        h('p', { className: 'muted' }, L('导入会读取 .pptx 的配色、字体、字号与重复出现的标志，全部在本机处理，不联网。', 'Importing reads colors, fonts, sizes and repeated marks from the .pptx locally. Nothing leaves this machine.')),
        h('h4', null, L('内置主题（只读）', 'Built-in themes (read-only)')),
        h('div', { className: 'tpl-list' }, TEMPLATE_BUILTIN.map(theme => h('div', { key: theme.id, className: 'tpl-saved' },
          h('div', null, h('strong', null, L(theme.zh, theme.en) + ' · ' + theme.id), h('div', { className: 'file muted' }, theme.palette.bg + ' · ' + theme.palette.accent)),
          h('span', { style: { display: 'inline-flex', gap: '4px' } },
            h('span', { style: { width: '12px', height: '12px', borderRadius: '3px', background: theme.palette.bg, border: '1px solid rgba(0,0,0,.15)' } }),
            h('span', { style: { width: '12px', height: '12px', borderRadius: '3px', background: theme.palette.accent, border: '1px solid rgba(0,0,0,.15)' } }))))),
        h('h4', null, L('自定义模板', 'Custom templates')),
        templates.length
          ? h('div', { className: 'tpl-list' }, templates.map(row => h('div', { key: row.id, className: 'tpl-saved' },
            h('div', null, h('strong', null, templateLabel(row.name)), h('div', { className: 'file muted' }, row.id + ' · ' + safeColor(row.palette && row.palette.bg) + ' · ' + safeColor(row.palette && row.palette.accent))),
            h('div', { className: 'tools' },
              h('button', { disabled: busy, onClick: () => openSaved(row.id) }, L('编辑摆位', 'Edit layout')),
              h('button', { disabled: busy, onClick: () => remove(row.id, templateLabel(row.name)) }, L('删除', 'Delete'))))))
          : h('p', { className: 'muted' }, L('还没有自定义模板。导入一份现成 PPTX，或手动创建。', 'No custom templates yet. Import an existing PPTX or create one manually.')));
    }
    function editorView() {
      const current = draft.chrome[page], item = selected >= 0 ? current[selected] : null;
      const boxField = (label, index) => h('label', { key: label, style: { margin: 0 } }, label,
        h('input', { type: 'number', min: 0, max: 100, step: 0.1, value: Number(item.box[index].toFixed(1)), disabled: busy,
          onChange: event => {
            const next = Number(event.target.value); if (!Number.isFinite(next)) return;
            const box = item.box.slice(0, 4);
            box[index] = index < 2 ? clamp(snap(next), 0, 100 - box[index + 2]) : clamp(snap(next), 1, 100 - box[index - 2]);
            updateGeometry(selected, box);
          } }));
      return h(React.Fragment, null,
        h('div', { className: 'tools' },
          h('strong', null, templateLabel(draft.name) || L('未命名模板', 'Untitled template')),
          h('span', { className: 'muted' }, draft.id + (origin.kind === 'new' ? L(' · 未保存', ' · not saved') : L(' · 已有模板', ' · saved template'))),
          h('button', { disabled: busy, onClick: closeEditor }, L('返回模板列表', 'Back to templates'))),
        h('div', { className: 'coaching-grid' },
          h('label', null, L('名称（中文）', 'Name (Chinese)'), h('input', { value: draft.name.zh, maxLength: 80, disabled: busy, onChange: event => updateName('zh', event.target.value) })),
          h('label', null, L('名称（英文）', 'Name (English)'), h('input', { value: draft.name.en, maxLength: 80, disabled: busy, onChange: event => updateName('en', event.target.value) })),
          h('label', null, L('模板编号', 'Template id'), h('input', { value: draft.id, maxLength: 40, disabled: busy || origin.kind === 'update', onChange: event => updateId(event.target.value.toLowerCase()) })),
          h('label', null, L('深色底', 'Dark background'), h('input', { type: 'checkbox', checked: draft.dark === true, disabled: busy, onChange: event => setDraft(Object.assign({}, draft, { dark: event.target.checked })) }))),
        h('details', { open: true }, h('summary', null, L('配色', 'Colors')),
          h('div', { className: 'tpl-swatches' }, TEMPLATE_PALETTE_FIELDS.map(field => h('label', { key: field[0] }, L(field[1], field[2]) + ' · ' + field[0],
            h('div', { style: { display: 'flex', gap: '6px' } },
              h('input', { type: 'color', value: safeColor(draft.palette[field[0]]), disabled: busy, onChange: event => updatePalette(field[0], event.target.value) }),
              h('input', { value: draft.palette[field[0]] || '', maxLength: 7, disabled: busy, onChange: event => updatePalette(field[0], event.target.value) })))))),
        h('details', null, h('summary', null, L('字体', 'Fonts')),
          h('div', { className: 'coaching-grid' }, TEMPLATE_FONT_FIELDS.map(field => h('label', { key: field[0] }, L(field[1], field[2]), h('input', { value: draft.fonts[field[0]] || '', maxLength: 120, disabled: busy, onChange: event => updateFont(field[0], event.target.value) }))))),
        origin.kind === 'new' && h('details', { open: !Object.keys(assets).length }, h('summary', null, L('固定标志图片（3 个槽位）', 'Fixed mark images (3 slots)')),
          h('p', { className: 'muted' }, L('校徽、班徽等固定出现的图片。上传后在画布下方选择页型放置。', 'Marks that repeat on slides, such as a university or class logo. Upload them, then place them per page type under the canvas.')),
          TEMPLATE_ASSET_SLOTS.map(field => h('div', { key: field[0] },
            h('label', null, L(field[1], field[2]) + ' · ' + field[0]),
            h('input', { type: 'file', accept: 'image/png,image/jpeg', disabled: busy, onChange: event => uploadAsset(event, field[0]) }),
            assets[field[0]] && h('img', { className: 'image-preview', src: assets[field[0]], alt: field[0] })))),
        h('div', { className: 'tpl-tabs', role: 'tablist' }, TEMPLATE_PAGES.map(entry => h('button', { key: entry[0], role: 'tab', 'aria-selected': page === entry[0] ? 'true' : 'false', className: page === entry[0] ? 'primary' : undefined, disabled: busy, onClick: () => { setPage(entry[0]); setSelected(-1); } }, L(entry[1], entry[2]) + ' · ' + draft.chrome[entry[0]].length))),
        h('div', { className: 'tpl-canvas', ref: canvas, role: 'application', 'aria-label': L('模板摆位画布', 'Template layout canvas'),
          style: { background: safeColor(draft.palette.bg), color: safeColor(draft.palette.fg) },
          onPointerDown: event => { if (event.target === event.currentTarget) setSelected(-1); } },
          current.map(itemNode),
          !current.length && h('p', { className: 'muted', style: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '12px', textAlign: 'center' } }, L('此页型还没有固定元素。用下方按钮添加图片或文字。', 'No fixed items on this page type yet. Add an image or text with the buttons below.'))),
        h('div', { className: 'tools' },
          h('label', { style: { margin: 0 } }, L('标志图片', 'Mark image'), h('select', { value: pickSlot, disabled: busy || !pickSlot, style: { width: 'auto' }, onChange: event => setPickSlot(event.target.value) }, (Object.keys(assets).length ? Object.keys(assets) : ['']).map(slot => h('option', { key: slot, value: slot }, slot || L('先上传标志', 'Upload a mark first'))))),
          h('button', { disabled: busy || !pickSlot, onClick: () => addItem({ kind: 'image', asset: pickSlot, box: [4, 4, 20, 10] }) }, L('把图片放到本页型', 'Place image on this page type')),
          h('button', { disabled: busy, onClick: () => addItem({ kind: 'text', text: L('班级 / 单位名称', 'Class or unit name'), size: 14, color: draft.palette.accent, font: 'accent', align: 'left', box: [4, 88, 30, 6] }) }, L('添加文字', 'Add text'))),
        item && h('div', { className: 'card' },
          h('div', { className: 'tools' }, h('strong', null, item.kind === 'text' ? L('文字元素', 'Text item') : L('图片元素', 'Image item')), h('span', { className: 'muted' }, (selected + 1) + ' / ' + current.length)),
          h('div', { className: 'tpl-row', style: { gridTemplateColumns: 'repeat(4,minmax(0,1fr))' } }, boxField('X %', 0), boxField('Y %', 1), boxField(L('宽 %', 'W %'), 2), boxField(L('高 %', 'H %'), 3)),
          item.kind === 'text' ? h(React.Fragment, null,
            h('label', null, L('文字内容', 'Text'), h('input', { value: item.text, maxLength: 200, disabled: busy, onChange: event => editItem(selected, { text: event.target.value }) })),
            h('div', { className: 'tpl-row' },
              h('label', { style: { margin: 0 } }, L('字号 pt', 'Size pt'), h('input', { type: 'number', min: 8, max: 96, step: 1, value: item.size, disabled: busy, onChange: event => editItem(selected, { size: clamp(Math.round(Number(event.target.value) || 8), 8, 96) }) })),
              h('label', { style: { margin: 0 } }, L('颜色', 'Color'), h('input', { type: 'color', value: safeColor(item.color), disabled: busy, onChange: event => editItem(selected, { color: event.target.value.toUpperCase() }) })),
              h('label', { style: { margin: 0 } }, L('字体', 'Font'), h('select', { value: item.font, disabled: busy, onChange: event => editItem(selected, { font: event.target.value }) }, h('option', { value: 'heading' }, L('标题字体', 'Heading')), h('option', { value: 'body' }, L('正文字体', 'Body')), h('option', { value: 'accent' }, L('装饰字体', 'Accent')))),
              h('label', { style: { margin: 0 } }, L('对齐', 'Align'), h('select', { value: item.align, disabled: busy, onChange: event => editItem(selected, { align: event.target.value }) }, h('option', { value: 'left' }, L('左对齐', 'Left')), h('option', { value: 'center' }, L('居中', 'Center')), h('option', { value: 'right' }, L('右对齐', 'Right'))))))
            : h('label', null, L('标志素材', 'Mark asset'), h('select', { value: item.asset, disabled: busy, onChange: event => editItem(selected, { asset: event.target.value }) }, Object.keys(Object.assign({}, draft.assets, assets)).map(slot => h('option', { key: slot, value: slot }, slot)))),
          h('div', { className: 'tools' }, h('button', { disabled: busy, onClick: () => removeItem(selected) }, L('删除选中元素', 'Delete selected item')),
            h('span', { className: 'muted' }, L('拖动移动；右下角方块缩放；方向键微调 0.1%，Shift 加速到 1%。', 'Drag to move, use the corner handle to resize, arrow keys nudge 0.1% (Shift: 1%).')))),
        h('div', { className: 'tools' },
          h('button', { className: 'primary', disabled: busy, onClick: save }, origin.kind === 'update' ? L('保存模板修改', 'Save template changes') : L('保存模板', 'Save template')),
          h('button', { disabled: busy, onClick: closeEditor }, L('取消', 'Cancel')),
          origin.kind === 'update' && h('button', { disabled: busy, onClick: () => remove(origin.id, templateLabel(draft.name)) }, L('删除此模板', 'Delete this template'))));
    }
    function uploadAsset(event, slot) {
      const file = event.target.files && event.target.files[0]; event.target.value = ''; if (!file) return;
      if (!/^image\/(png|jpeg)$/.test(file.type) || file.size > 5 * 1024 * 1024) { setError(L('请选择 5 MiB 以内的 PNG 或 JPEG 图片。', 'Choose a PNG or JPEG image up to 5 MiB.')); return; }
      return task(async () => {
        const url = await readDataUrl(file), size = await measure(url);
        setAssets(current => Object.assign({}, current, { [slot]: url }));
        setDraft(current => current ? Object.assign({}, current, { assets: Object.assign({}, current.assets, { [slot]: { file: 'assets/' + slot + '.png', width: size.width, height: size.height, alpha: true } }) }) : current);
        setNotice(L('已上传标志，可在画布下方添加到页型。', 'Mark uploaded. Add it to a page type under the canvas.'));
      });
    }
    return h('section', { className: 'card', 'aria-label': t('模板库') },
      h('h3', null, t('模板')),
      h('p', { className: 'muted' }, L('导入现成 PPTX 或手动创建模板：配色、字体与固定标志的位置会同时用于 HTML 和 PPTX。模板只保存在本机。', 'Import an existing PPTX or create a template: colors, fonts and fixed mark positions apply to both HTML and PPTX. Templates stay on this machine.')),
      !expanded ? h('div', { className: 'tools' }, h('button', { disabled: busy, onClick: toggle }, t('模板库'))) : h(React.Fragment, null,
        h('div', { className: 'tools' },
          h('button', { disabled: busy, onClick: toggle }, L('收起模板库', 'Collapse template library')),
          templates.length > 0 && h('span', { className: 'muted' }, L('自定义模板 ', 'Custom templates ') + templates.length)),
        error && h('div', { role: 'alert', className: 'notice error' }, error),
        notice && h('div', { role: 'status', className: 'notice' }, notice),
        busy && h('div', { role: 'status', className: 'muted' }, L('正在处理模板…', 'Working on templates…')),
        draft ? editorView() : listView()));
  }
  function Workbench({ locale } = {}) {
    useLanguage(locale);
    const [projects, setProjects] = useState([]), [project, setProject] = useState(null), [selected, setSelected] = useState('');
    const [draft, setDraft] = useState({}), [image, setImage] = useState(null), [dirty, setDirty] = useState(false);
    const [dataDirty,setDataDirty]=useState(false),[incomingData,setIncomingData]=useState(null);
    const [busy, setBusy] = useState(false), [job, setJob] = useState(''), [message, setMessage] = useState(''), [error, setError] = useState('');
    const [mode, setMode] = useState('html'), [raster, setRaster] = useState('');
    const [conflict, setConflict] = useState(false), [overlaps, setOverlaps] = useState([]);
    const frame = useRef(null), previewBox = useRef(null), fieldRefs = useRef({}), alive = useRef(true), operations = useRef(new Set());
    const imageLoader = useRef(null);
    if (!imageLoader.current) imageLoader.current = createImageLoader();
    const imagePending = imageLoader.current.pending;
    const nonce = useRef(crypto.randomUUID());
    const dataCommand=useRef(0);
    const previewDocument = useMemo(() => project?.html ? editorHtml(project.html, nonce.current) : '', [project?.html]);
    const index = project ? Math.max(0, project.slides.findIndex(s => s.id === selected)) : 0;
    const slide = project?.slides[index];
    function adopt(next, preferred) {
      imageLoader.current.cancel();
      nonce.current=crypto.randomUUID();setDataDirty(false);setIncomingData(null);
      setProject(next);
      const row = next.slides.find(s => s.id === preferred) || next.slides[0];
      setSelected(row.id); setDraft(draftFor(row)); setImage(null); setDirty(false); setRaster(''); setOverlaps([]);
      if (!next.render) setMode('html');
    }
    async function perform(work, success, label = t("正在处理，请稍候…")) {
      setBusy(true); setJob(label); setError(''); setMessage(''); setConflict(false);
      const controller = new AbortController(); operations.current.add(controller);
      try { const result = await work(controller.signal); if (alive.current && success) success(result); }
      catch (e) { if (alive.current) { setError(e.message || t("操作失败")); setConflict(e.status === 409); } }
      finally { operations.current.delete(controller); if (alive.current) setBusy(false); }
    }
    function refreshList() { return perform(signal => action({ operation: 'list' }, signal), value => setProjects(value.projects)); }
    useEffect(() => {
      alive.current = true; const abort = new AbortController();
      action({ operation: 'list' }, abort.signal).then(value => { if (alive.current) setProjects(value.projects) }).catch(e => { if (!abort.signal.aborted) setError(e.message) });
      return () => { alive.current = false; abort.abort(); imageLoader.current.cancel(); for (const operation of operations.current) operation.abort(); };
    }, []);
    useEffect(() => {
      function receive(event) {
        if (event.source !== frame.current?.contentWindow || event.data?.nonce !== nonce.current || mode !== 'html') return;
        if(event.data.type==='dsh-ppt-data'){if(typeof event.data.command==='number'&&event.data.command!==dataCommand.current)return;setIncomingData({parameters:event.data.parameters,valid:event.data.valid});return;}
        if (event.data.type === 'dsh-ppt-shortcut') { handleShortcut(event.data.key); return; }
        if (event.data.type !== 'dsh-ppt-select') return;
        const key = event.data.field;
        const field = fields.find(([field]) => field === key);
        if (field) { fieldRefs.current[key]?.focus(); fieldRefs.current[key]?.scrollIntoView({ block: 'nearest' }); setMessage(t("已定位到") + t(field[1]) + t("，在字段中修改后保存。")); }
      }
      window.addEventListener('message', receive); return () => window.removeEventListener('message', receive);
    }, [mode, project, dirty, busy, imagePending, index, selected, draft, image, dataDirty]);
    useEffect(() => {
      if (mode !== 'html' || !project || !previewBox.current) return;
      // Align iframe edges/dimensions when the host uses fractional text metrics.
      const box = previewBox.current;
      function align() {
        const target = frame.current; if (!target) return;
        const r = box.getBoundingClientRect(), x = r.x + box.clientLeft, y = r.y + box.clientTop;
        target.style.width = box.clientWidth + 'px'; target.style.height = box.clientHeight + 'px';
        target.style.transform = 'translate(' + (Math.ceil(x) - x) + 'px,' + (Math.ceil(y) - y) + 'px)';
      }
      align(); const observer = new ResizeObserver(align); observer.observe(box);
      window.addEventListener('scroll', align, true);
      return () => { observer.disconnect(); window.removeEventListener('scroll', align, true); };
    }, [mode, !!project]);
    function jump() { frame.current?.contentWindow?.postMessage({ type: 'dsh-ppt-jump', nonce: nonce.current, page: index }, '*'); }
    useEffect(() => { jump(); }, [index, project?.revision, mode]);
    useEffect(() => {
      if (mode !== 'pptx' || !project?.render) return;
      const abort = new AbortController(); setRaster('');
      action({ operation: 'page', id: project.id, page: index + 1 }, abort.signal).then(value => setRaster(value.data)).catch(e => { if (!abort.signal.aborted) setError(e.message) });
      return () => abort.abort();
    }, [mode, index, project?.revision]);
    function handleShortcut(key) {
      if(dataDirty)return;
      if (key === 'save') { if (project && dirty && !busy && !imagePending) save(); return; }
      if (key === 'escape') {
        if (!project || busy || imagePending) return;
        if (dirty) {
          if (!window.confirm(t("有未保存修改，确定取消吗？"))) return;
          setDraft(draftFor(slide)); setImage(null); setDirty(false); setError(''); setMessage(t("已取消未保存的修改。"));
        } else {
          imageLoader.current.cancel(); setProject(null); refreshList();
        }
        return;
      }
      if (key === 'prev' || key === 'next') {
        if (!project || busy || dirty || imagePending) return;
        const next = index + (key === 'next' ? 1 : -1);
        if (next >= 0 && next < project.slides.length) choose(project.slides[next]);
      }
    }
    useEffect(() => {
      function onKey(event) {
        if (event.isComposing || event.defaultPrevented) return;
        if (event.key === 'Escape' && event.target && event.target.tagName === 'SELECT') return;
        const mod = event.ctrlKey || event.metaKey;
        if (mod && (event.key === 's' || event.key === 'S')) {
          if (!project) return;
          event.preventDefault(); handleShortcut('save'); return;
        }
        if (event.key === 'Escape') {
          if (!project || busy || imagePending) return;
          event.preventDefault(); handleShortcut('escape'); return;
        }
        if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
          if (!project || busy || dirty || imagePending) return;
          event.preventDefault(); handleShortcut(event.key === 'ArrowRight' ? 'next' : 'prev');
        }
      }
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }, [project, dirty, busy, imagePending, index, selected, draft, image, dataDirty]);
    useEffect(() => {
      if (!dirty && !dataDirty) return;
      function warn(event) { event.preventDefault(); event.returnValue = t("有未保存修改，离开页面会丢失。"); }
      window.addEventListener('beforeunload', warn);
      return () => window.removeEventListener('beforeunload', warn);
    }, [dirty,dataDirty]);
    function open(id) { return perform(signal => action({ operation: 'open', id }, signal), value => { adopt(value.project); setMessage(t("点击预览里的文字，或在下方修改字段。")); }); }
    function keepInputsAndReload() {
      const original = draftFor(slide), keys = fields.filter(([key]) => draft[key] !== original[key]).map(([key]) => key), pending = { ...draft }, pendingImage = image;
      return perform(signal => action({ operation: 'open', id: project.id }, signal), value => {
        const row = value.project.slides.find(s => s.id === selected);
        if (!row) { setError(t("当前页已被删除，输入仍保留，请复制需要的内容后取消修改。")); return; }
        const latest = draftFor(row), merged = { ...latest }, shared = [];
        for (const key of keys) { merged[key] = pending[key]; if (latest[key] !== original[key] && latest[key] !== pending[key]) shared.push({ key, latest: latest[key], yours: pending[key] }); }
        adopt(value.project, selected); setDraft(merged); setImage(pendingImage); setDirty(keys.length > 0 || !!pendingImage); setOverlaps(shared);
        setMessage(t("已载入最新版本并保留你的修改，请核对后再保存。"));
      });
    }
    function choose(row) { if (dirty || busy) return; imageLoader.current.cancel(); setSelected(row.id); setDraft(draftFor(row)); setImage(null); setMessage(''); }
    function save(saveAs = false) {
      if(dataDirty)return;
      const original = draftFor(slide), patch = {};
      for (const [key] of fields) if (draft[key] !== original[key]) patch[key] = key === 'bullets' ? draft[key].split('\n').map(v => v.trim()).filter(Boolean) : draft[key];
      if (image) patch.image = { src: image.src, alt: image.alt, fit: image.fit, caption: image.caption };
      return perform(signal => action({ operation: 'edit', id: project.id, expectedRevision: project.revision, slide: slide.id, patch, saveAs }, signal), value => {
        adopt(value.project, slide.id); setMessage(saveAs ? t("副本已保存，原文件保留。副本从工程生成，不包含 Office 手工修改。") : value.changed === false ? t("内容没有变化。") : t("已保存，HTML、PPTX 和工程文件已同步更新。"));
      });
    }
    function move(delta) {
      if(dataDirty)return;
      const order = project.slides.map(s => s.id); [order[index], order[index + delta]] = [order[index + delta], order[index]];
      return perform(signal => action({ operation: 'edit', id: project.id, expectedRevision: project.revision, order }, signal), value => { adopt(value.project, slide.id); setMessage(t("页面顺序已更新，可撤销。")); });
    }
    function structure(operation) {
      if(dataDirty)return;
      return perform(signal => action({ operation, id: project.id, expectedRevision: project.revision, slide: slide.id }, signal), value => {
        adopt(value.project, value.selected);
        setMessage(operation === 'duplicate' ? t("页面已复制，图片、图表和备注一并保留，可撤销。") : t("页面已删除，可撤销。"));
      });
    }
    function undo() { if(dataDirty)return;return perform(signal => action({ operation: 'undo', id: project.id, expectedRevision: project.revision }, signal), value => { adopt(value.project, selected); setMessage(t("已撤销上次修改。")); }); }
    function render() {
      if(dataDirty)return;
      return perform(signal => action({ operation: 'render', id: project.id, expectedRevision: project.revision }, signal), value => { adopt(value.project, selected); setMode('pptx'); setMessage(t("当前 PPTX 已生成逐页图片，请查看画面。")); }, t("正在渲染最终 PPTX，较大文件可能需要几分钟…"));
    }
    function download(kind) {
      if(dataDirty)return;
      const url = new URL('api/dsh-ppt/download', document.baseURI);
      url.searchParams.set('id', project.id); url.searchParams.set('kind', kind); url.searchParams.set('revision', String(project.revision));
      // An authenticated attachment response keeps the click's user gesture and
      // works in WebViews whose native download handler cannot read blob URLs.
      const link = document.createElement('a'); link.href = url.href; link.download = '';
      link.hidden = true; document.body.append(link); link.click(); link.remove();
      setMessage(t("已请求下载，请查看浏览器的下载列表。"));
    }
    function copyExample() {
      const text = t("示例：请把这份材料制作成可直接交付的演示文稿，生成 HTML、PPTX 和工程文件。");
      try { navigator.clipboard?.writeText(text).then(() => setMessage(t("已复制示例"))).catch(() => {}); } catch (_) { /* ignore */ }
    }
    function upload(event) {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
      imageLoader.current.cancel(); setMessage(''); setError('');
      if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) { setError(t("请选择 5 MiB 以内的 PNG 或 JPEG 图片。")); return; }
      imageLoader.current.read(file, data => {
        if (!alive.current) return;
        setImage({ src: data, alt: slide.image?.alt || file.name.replace(/\.[^.]+$/, ''), caption: slide.image?.caption || '', fit: slide.image?.fit || 'contain', name: file.name });
        setDirty(true); setError(''); setMessage(t("图片已载入，保存后生效。"));
      }, () => { if (alive.current) { setError(t("无法读取图片，请重试。")); setMessage(''); } });
      if (imageLoader.current.pending) setMessage(t("正在读取图片，切换页面会取消本次读取。"));
    }
    const currentImage = image?.src || (slide?.image?.assetId && project.assets[slide.image.assetId]?.data);
    return h('div', { className: 'pptw', 'aria-busy': busy ? 'true' : undefined }, h('style', null, css),
      h('h2', null, t("演示文稿编辑")), h('p', { className: 'muted' }, t("修改本插件生成的成品，保存时同步更新 HTML、可编辑 PPTX 和工程文件。")),
      h('p', { className: 'muted' }, t("快捷键：Ctrl/⌘+S 保存 · Esc 取消或返回 · Alt+←/→ 切换页面")),
      error && h('div', { role: 'alert', className: 'notice error' }, error, ' ', h('button', { disabled: busy || dataDirty, onClick: () => project ? open(project.id) : refreshList() }, t("重试"))),
      conflict && project && h('button', { disabled: busy || dataDirty, onClick: keepInputsAndReload }, t("载入最新版本，保留我的输入")),
      message && h('div', { role: 'status', className: 'notice' }, message),
      busy && h('div', { role: 'status', className: 'muted' }, job),
      !project ? h(React.Fragment, null,
        h('div', { className: 'tools' }, h('button', { onClick: refreshList, disabled: busy }, t("刷新项目"))),
        projects.length ? h('div', { className: 'project-list' }, projects.map(row => h('button', { key: row.id, onClick: () => open(row.id), disabled: busy }, h('strong', null, row.title), h('div', { className: 'file muted' }, row.path)))) :
          h('div', { className: 'card' }, h('h3', null, t("还没有可以编辑的项目")), h('p', null, t("先在对话中让助手生成演示文稿。已有项目可以让助手调用 ppt_check 检查一次，它会出现在这里。")), h('p', { className: 'muted' }, t("示例：请把这份材料制作成可直接交付的演示文稿，生成 HTML、PPTX 和工程文件。")), h('div', { className: 'tools' }, h('button', { onClick: copyExample }, t("复制示例")))),
        h(TemplatePanel)
      ) : h(React.Fragment, null,
        h('div', { className: 'tools' }, h('button', { disabled: busy || dirty || dataDirty, onClick: () => { imageLoader.current.cancel(); setImage(null); setProject(null); refreshList(); } }, t("返回项目")), h('strong', null, project.title), (dirty||dataDirty) && h('span', { className: 'badge-dirty', role: 'status' }, t("未保存")), h('span', { className: 'muted' }, project.slides.length + t(" 页 · 修订 ") + project.revision)),
        h('div', { className: 'layout' },
          h('div', null, h('h3', null, t("页面")), h('div', { className: 'pages' }, project.slides.map((row, i) => h('button', { key: row.id, 'aria-current': row.id === selected ? 'true' : undefined, disabled: busy || dirty, onClick: () => choose(row) }, (i + 1) + '. ' + (row.title || t("未命名页"))))),
            h('div', { className: 'tools' }, h('button', { disabled: busy || dirty || imagePending || dataDirty || index === 0, onClick: () => move(-1) }, t("上移")), h('button', { disabled: busy || dirty || imagePending || dataDirty || index === project.slides.length - 1, onClick: () => move(1) }, t("下移")),
              h('button', { disabled: busy || dirty || imagePending || dataDirty || project.slides.length >= 120, onClick: () => structure('duplicate') }, t("复制本页")),
              h('button', { disabled: busy || dirty || imagePending || dataDirty || project.slides.length <= 1, onClick: () => structure('remove') }, t("删除本页")))),
          h('div', null,
            h('div', { className: 'tools' }, h('button', { disabled: busy || dataDirty, 'aria-pressed': mode === 'html', onClick: () => setMode('html') }, t("HTML 预览")),
              h('button', { disabled: busy || dataDirty || !project.render, 'aria-pressed': mode === 'pptx', onClick: () => setMode('pptx') }, t("最终 PPTX 预览")),
              h('button', { disabled: busy || dirty || imagePending || dataDirty, onClick: render }, t("渲染当前 PPTX"))),
            h('div', { className: 'preview', ref: previewBox }, mode === 'html' ? (project.html ? h('iframe', { ref: frame, title: t("演示文稿 HTML 预览"), sandbox: 'allow-scripts', srcDoc: previewDocument, onLoad: jump }) : h('p', null, t("此项目尚无 HTML，请保存一次生成预览。"))) : raster ? h('img', { className: 'render-page', src: raster, alt: t("最终 PPTX 第 ") + (index + 1) + t(" 页渲染结果") }) : h('p', null, t("正在载入当前页渲染…"))),
            h('p', { className: 'muted' }, mode === 'html' ? t("这是 HTML 放映预览。最终 PPTX 的字体和排版请用上方渲染检查。点击文字可定位编辑字段。") : t("这是当前 PPTX 文件的实际渲染图片，仍需检查每页画面；PowerPoint / WPS 可能因字体环境而不同。")),
            project.render?.missingFonts?.length ? h('div', { role: 'alert', className: 'notice error' }, t("渲染引擎报告缺失字体：") + project.render.missingFonts.join('、') + t("。请替换为目标电脑可用字体后重新渲染。")) : null,
            h('div', { className: 'card' }, h('h3', null, t("编辑第 ") + (index + 1) + t(" 页")),
              dirty && h('p', { className: 'dirty' }, t("有未保存修改，请先保存或取消，再切换页面。")),
              overlaps.length ? h('div', { className: 'notice' }, h('strong', null, t("这些字段也被修改过，请比较后决定是否保存：")), overlaps.map(row => h('div', { key: row.key }, h('strong', null, t(fields.find(([key]) => key === row.key)[1])), h('p', null, t("最新版本：") + row.latest), h('p', null, t("你的修改：") + row.yours)))) : null,
              fields.filter(([key]) => key === 'title' || key === 'notes' || key === 'bullets' && (slide.layout === 'bullets' || slide.bullets?.length > 0) || key !== 'bullets' && (slide[key] || key === 'subtitle' && ['cover','section','closing','quote'].includes(slide.layout) || key === 'kicker' && ['cover','section','closing'].includes(slide.layout))).map(([key, label]) => h('div', { key }, h('label', { htmlFor: 'pptw-' + key }, t(label)), h(key === 'title' || key === 'kicker' ? 'input' : 'textarea', { id: 'pptw-' + key, ref: el => { fieldRefs.current[key] = el }, disabled: busy || dataDirty, value: draft[key] || '', rows: key === 'bullets' ? 4 : 2, maxLength: 8000, onChange: e => { setDraft({ ...draft, [key]: e.target.value }); setDirty(true); } }))),
              h('label', { htmlFor: 'pptw-image' }, slide.image ? t("替换图片（PNG / JPEG）") : t("添加图片（会改为图文布局）")),
              h('input', { id: 'pptw-image', type: 'file', accept: 'image/png,image/jpeg', disabled: busy || dataDirty, onChange: upload }),
              currentImage && h('img', { className: 'image-preview', src: currentImage, alt: image?.alt || slide.image?.alt || t("当前图片") }),
              image && h(React.Fragment, null, h('p', { className: 'muted' }, t("已选择：") + image.name), h('label', { htmlFor: 'pptw-alt' }, t("图片说明")), h('input', { id: 'pptw-alt', value: image.alt, disabled: busy || dataDirty, onChange: e => setImage({ ...image, alt: e.target.value }) }), h('label', { htmlFor: 'pptw-fit' }, t("图片适应方式")), h('select', { id: 'pptw-fit', value: image.fit, disabled: busy || dataDirty, onChange: e => setImage({ ...image, fit: e.target.value }) }, h('option', { value: 'contain' }, t("完整显示")), h('option', { value: 'cover' }, t("填满并裁切")))),
              h('div', { className: 'tools' }, h('button', { className: 'primary', 'aria-keyshortcuts': 'Control+S Meta+S', disabled: busy || dataDirty || imagePending || !dirty, onClick: () => save() }, t("保存此页")), h('button', { 'aria-keyshortcuts': 'Control+Shift+S Meta+Shift+S', disabled: busy || dataDirty || imagePending, onClick: () => save(true) }, t("另存副本")), h('button', { 'aria-keyshortcuts': 'Escape', disabled: busy || (!dirty && !imagePending), onClick: () => { imageLoader.current.cancel(); setDraft(draftFor(slide)); setImage(null); setDirty(false); setError(''); setMessage(''); setConflict(false); setOverlaps([]); } }, t("取消修改")), h('button', { disabled: busy || dirty || imagePending || dataDirty || !project.undoAvailable, onClick: undo }, t("撤销上次修改")))),
            h('details', { className: 'card' }, h('summary', null, t("质量提醒（") + (project.quality.warningCount + project.quality.errorCount) + (languageOf() === 'en' ? ')' : '）')), (project.quality.issues || []).map((issue, i) => h('p', { key: i }, (issue.slide > 0 ? t("第 ") + issue.slide + t(" 页：") : "") + (languageOf() === 'en' ? issue.messageEn : issue.message) + (languageOf() === 'en' ? ' ' : '；') + (languageOf() === 'en' ? issue.suggestionEn : issue.suggestion)))),
            h('p', { className: 'muted' }, t("成品包包含 PPTX、HTML 和工程文件。请先保存修改，再下载最新版本。")),
            h('div', { className: 'tools' }, h('button', { className: 'primary', disabled: busy || dirty || imagePending || dataDirty, onClick: () => download('bundle') }, t("下载成品包 ZIP")), h('button', { disabled: busy || dirty || imagePending || dataDirty, onClick: () => download('pptx') }, t("下载最新 PPTX")), h('button', { disabled: busy || dirty || imagePending || dataDirty, onClick: () => download('html') }, t("下载 HTML")), h('button', { disabled: busy || dirty || imagePending || dataDirty, onClick: () => download('notes') }, t("下载讲稿 Markdown")), h('button', { disabled: busy || dirty || imagePending || dataDirty, onClick: () => download('json') }, t("备份工程"))),
            project.dataModel&&mode!=='html'&&h('p',{className:'notice'},languageOf()==='en'?'Switch to HTML preview to adjust assumptions and inspect live data.':'切换到 HTML 预览后可调整假设并查看数据联动。'),
            project.dataModel&&h(DataPanel,{key:project.id+':'+project.revision,project,blocked:busy||dirty||imagePending||mode!=='html',incoming:incomingData,
              onParameters:parameters=>frame.current?.contentWindow?.postMessage({type:'dsh-ppt-data-set',nonce:nonce.current,parameters,command:++dataCommand.current},'*'),onDirty:setDataDirty,onBusy:value=>{setBusy(value);setJob(languageOf()==='en'?'Updating presentation data…':'正在核对并更新数据…');},
              onAdopt:next=>{adopt(next,selected);setMessage(languageOf()==='en'?'Saved confirmed data. HTML, PPTX and project are synchronized; undo is available.':'已保存确认后的数据，HTML、PPTX 和工程已同步，可撤销。');},onChoose:id=>choose(project.slides.find(s=>s.id===id)),onDownload:download}),
            h(VisualPanel,{key:'visual:'+project.id,project,selected,blocked:busy||dirty||imagePending||dataDirty,
              onBusy:value=>{setBusy(value);setJob(languageOf()==='en'?'Reviewing rendered slides…':'正在检查和复查实际 PPTX 画面…');},
              onAdopt:next=>{adopt(next,selected);setMode(next.render?'pptx':'html');setMessage(languageOf()==='en'?'Opened the repaired copy. The original is kept, and formatting changes can be undone.':'已打开修复副本，原稿保留，可撤销排版修改。');}}),
            h(CoachingPanel, { key: project.id, project, selected, blocked: busy || dirty || imagePending || dataDirty,
              onChoose: id => { choose(project.slides.find(s => s.id === id)); previewBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); },
              onAdopt: next => { adopt(next, selected); setMessage(languageOf() === 'en' ? 'Saved to a new copy. The original is kept; you can undo the adopted changes in this copy.' : '已保存为新副本，原稿保留；可在当前副本中撤销采纳的修改。'); } })
          )
        )
      )
    );
  }
  function apply(ctx) {
    try { localeService = ctx.get?.('locale') || ctx.locale; } catch { localeService = ctx.locale; }
    ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-ppt', order: 58, label: () => t("演示文稿"), inject: () => ({ locale: localeService }) }, __withFirstRun(Workbench)));
  }
  return { inject: ['slots', 'locale'], apply, __internals: { draftFor, editorHtml, createImageLoader, modelRouteKey, findModelRoute, reconcileModelRoute, templatePanel: TemplatePanel, templateDraft, templatePayload, templateAssetUrls } };
} });
