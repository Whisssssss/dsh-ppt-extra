import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ensureTemplateProvider, extractFromPptxFile, listTemplates, readTemplate, removeTemplate, saveTemplate, setTemplateDir, updateTemplate, } from './templates.js';
let enginePromise = null;
export function getEngine() {
    if (enginePromise === null) {
        const engineUrl = new URL('../skills/dsh-ppt/scripts/deck-advanced.mjs', import.meta.url);
        enginePromise = import(engineUrl.href).then((module) => module)
            .catch((error) => {
            enginePromise = null;
            throw error;
        });
    }
    return enginePromise;
}
function asRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
/** Build executors with a shared engine loader; resolve paths separately for each call. */
export function createPptExecutors(config, loadEngine = getEngine) {
    if (config.templatesDir !== '')
        setTemplateDir(config.templatesDir);
    return {
        async themes(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const args = asRecord(rawArgs);
            const lang = typeof args.lang === 'string' && args.lang.trim() !== '' ? args.lang.trim() : 'zh';
            const engine = await loadEngine();
            await ensureTemplateProvider();
            exec?.signal?.throwIfAborted();
            const themes = engine.listThemes(lang, listTemplates());
            if (args.preview === true) {
                const cwd = exec?.agent?.session.header.cwd ?? process.cwd();
                const requested = typeof args.outputDir === 'string' && args.outputDir.trim() !== '' ? args.outputDir.trim() : config.outputDir || '.';
                const preview = engine.buildThemePreview({
                    outputDir: resolve(cwd, requested),
                    lang,
                    overwrite: args.overwrite === true,
                });
                return { ok: true, themes, preview };
            }
            return { ok: true, themes };
        },
        async create(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const args = asRecord(rawArgs);
            if (typeof args.title !== 'string' || args.title.trim() === '')
                throw new Error('dsh-ppt：title 不能为空');
            const hasContent = typeof args.content === 'string' && args.content.trim() !== '';
            const hasSlides = Array.isArray(args.slides) && args.slides.length > 0;
            if (!hasContent && !hasSlides && !args.template)
                throw new Error('dsh-ppt：content 不能为空（或用 slides / template 传结构化幻灯片）');
            const engine = await loadEngine();
            // 模板 provider 必须在 resolveTheme 之前就位；放在引擎加载之后，保持取消时序不变。
            await ensureTemplateProvider();
            // Check cancellation after loading and before artifact commit inside the async engine.
            exec?.signal?.throwIfAborted();
            const cwd = exec?.agent?.session.header.cwd ?? process.cwd();
            const outputDir = typeof args.outputDir === 'string' && args.outputDir.trim() !== '' ? args.outputDir.trim() : config.outputDir;
            return (engine.buildDeckAsync ?? engine.buildDeck)({
                title: args.title.trim(),
                content: typeof args.content === 'string' ? args.content : '',
                slides: hasSlides ? args.slides : undefined,
                theme: typeof args.theme === 'string' && args.theme.trim() !== '' ? args.theme.trim() : (config.defaultTheme || undefined),
                lang: typeof args.lang === 'string' && args.lang.trim() !== '' ? args.lang.trim() : (config.defaultLang || undefined),
                motion: args.motion,
                outputDir: resolve(cwd, outputDir || '.'),
                fileName: typeof args.fileName === 'string' && args.fileName.trim() !== '' ? args.fileName.trim() : undefined,
                overwrite: args.overwrite === true,
                maxSlides: config.maxSlides,
                template: args.template,
                designTemplate: typeof args.designTemplate === 'string' && args.designTemplate.trim() !== '' ? args.designTemplate.trim() : undefined,
                themeIgnored: Boolean(args.designTemplate && args.theme),
                brand: args.brand,
                dataModel: args.dataModel,
                cwd,
                signal: exec?.signal,
            });
        },
        async templates(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const args = asRecord(rawArgs);
            const engine = await loadEngine();
            exec?.signal?.throwIfAborted();
            return { ok: true, templates: engine.listTemplates(typeof args.lang === 'string' ? args.lang : config.defaultLang || 'zh') };
        },
        async edit(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const engine = await loadEngine();
            exec?.signal?.throwIfAborted();
            return engine.editDeck({ ...asRecord(rawArgs), cwd: exec?.agent?.session.header.cwd ?? process.cwd(), signal: exec?.signal });
        },
        async undo(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const engine = await loadEngine();
            exec?.signal?.throwIfAborted();
            return engine.undoDeck({ ...asRecord(rawArgs), cwd: exec?.agent?.session.header.cwd ?? process.cwd(), signal: exec?.signal });
        },
        async check(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const engine = await loadEngine();
            exec?.signal?.throwIfAborted();
            return (engine.checkDeckAsync ?? engine.checkDeck)({ ...asRecord(rawArgs), cwd: exec?.agent?.session.header.cwd ?? process.cwd(), signal: exec?.signal });
        },
        async render(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const engine = await loadEngine();
            exec?.signal?.throwIfAborted();
            return engine.renderDeck({ ...asRecord(rawArgs), cwd: exec?.agent?.session.header.cwd ?? process.cwd(), signal: exec?.signal });
        },
        async templateList(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            await ensureTemplateProvider();
            const args = asRecord(rawArgs);
            const id = typeof args.id === 'string' ? args.id.trim() : '';
            if (id !== '')
                return { ok: true, template: readTemplate(id) };
            return { ok: true, templates: listTemplates() };
        },
        async templateImport(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const args = asRecord(rawArgs);
            const file = typeof args.file === 'string' ? args.file.trim() : '';
            if (file === '')
                throw new Error('dsh-ppt：file 不能为空');
            const cwd = exec?.agent?.session.header.cwd ?? process.cwd();
            const path = resolve(cwd, file);
            exec?.signal?.throwIfAborted();
            const bytes = readFileSync(path);
            const extracted = await extractFromPptxFile(bytes, path);
            // 兼容两种抽取返回结构：顶层 draftAssets，或嵌在 draft.draftAssets（旧实现）。
            const draft = { ...(extracted?.draft ?? {}) };
            const draftAssets = extracted?.draftAssets ?? draft.draftAssets ?? {};
            const candidates = extracted?.candidates ?? draft.candidates ?? [];
            delete draft.draftAssets;
            delete draft.candidates;
            if (typeof args.id === 'string' && args.id.trim() !== '')
                draft.id = args.id.trim();
            if (typeof args.name === 'string' && args.name.trim() !== '')
                draft.name = { ...(draft.name ?? {}), zh: args.name.trim() };
            if (args.dryRun === true) {
                return { ok: true, dryRun: true, draft, draftAssets, candidates, stats: extracted?.stats };
            }
            exec?.signal?.throwIfAborted();
            const saved = await saveTemplate({ template: draft, assets: draftAssets });
            return { ok: true, template: saved, candidates };
        },
        async templateUpdate(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const args = asRecord(rawArgs);
            const id = typeof args.id === 'string' ? args.id.trim() : '';
            if (id === '')
                throw new Error('dsh-ppt：id 不能为空');
            await ensureTemplateProvider();
            const patch = { ...args };
            delete patch.id;
            return { ok: true, template: await updateTemplate(id, patch) };
        },
        async templateRemove(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const args = asRecord(rawArgs);
            const id = typeof args.id === 'string' ? args.id.trim() : '';
            if (id === '')
                throw new Error('dsh-ppt：id 不能为空');
            if (args.confirmed !== true)
                throw new Error('dsh-ppt：删除模板需要 confirmed:true');
            return { ok: true, removed: removeTemplate(id) };
        },
        async data(rawArgs, exec) {
            exec?.signal?.throwIfAborted();
            const engine = await loadEngine(), args = asRecord(rawArgs);
            const options = { ...args, cwd: exec?.agent?.session.header.cwd ?? process.cwd(), signal: exec?.signal, allowFiles: true };
            if (args.action === 'preview')
                return engine.previewDeckData(options);
            if (args.action === 'apply')
                return engine.updateDeckData(options);
            throw new Error('dsh-ppt：action 需为 preview 或 apply / Use preview or apply');
        },
    };
}
