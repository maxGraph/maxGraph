// Generates TS library sources per variant and consumer entries (direct + barrel).
import fs from 'node:fs';
const W = (p, s) => { fs.mkdirSync(p.split('/').slice(0, -1).join('/'), { recursive: true }); fs.writeFileSync(p, s); };
const names = `{ CLICK: 'zzUSED_click', UNUSEDA: 'zzUNUSED_a', UNUSEDB: 'zzUNUSED_b', UNUSEDC: 'zzUNUSED_c' }`;
const other = `export const Other = { X: 'zzUNUSED_other' };\n`;
const addListener = `static addListener(el: any, name: string, fn: any) { el.addEventListener(name, fn); }`;
const libs = {
  v1: { 'InternalEvent.ts': `export class InternalEvent {\n  ${addListener}\n  static CLICK = 'zzUSED_click';\n  static UNUSEDA = 'zzUNUSED_a';\n  static UNUSEDB = 'zzUNUSED_b';\n  static UNUSEDC = 'zzUNUSED_c';\n}\n` },
  v2: { 'EventNames.ts': `export const EventNames = ${names};\n` },
  v3: { 'EventNames.ts': `export const EventNames = ${names};\n`,
        'InternalEvent.ts': `import { EventNames } from './EventNames.js';\nexport class InternalEvent {\n  ${addListener}\n  /** @deprecated */ static CLICK = EventNames.CLICK;\n  /** @deprecated */ static UNUSEDA = EventNames.UNUSEDA;\n  /** @deprecated */ static UNUSEDB = EventNames.UNUSEDB;\n  /** @deprecated */ static UNUSEDC = EventNames.UNUSEDC;\n}\n` },
  v4: { 'EventNames.ts': `export const EventNames = ${names};\n`,
        'helper.ts': `import { EventNames } from './EventNames.js';\nexport function f() { return EventNames.CLICK; }\n` },
  v5: { 'EventNames.ts': `export const EventNames: Record<string, string> = ${names};\n` },
  v6: { 'EventNames.ts': `export const EventNames = ${names} as const satisfies Record<string, string>;\n` },
  v7: { 'EventNames.ts': `export const EventNames = ${names};\n`,
        'helper.ts': `import { EventNames } from './EventNames.js';\nexport function getEventName(name: string) { return (EventNames as Record<string, string>)[name]; }\n` },
};
for (const [v, files] of Object.entries(libs)) {
  if (v !== 'v1') files['InternalEvent.ts'] ??= `export class InternalEvent {\n  ${addListener}\n}\n`;
  files['Other.ts'] = other;
  files['index.ts'] = Object.keys(files).filter(f => f !== 'index.ts').map(f => `export * from './${f.replace('.ts', '.js')}';`).join('\n') + '\n';
  for (const [f, s] of Object.entries(files)) W(`src/${v}/${f}`, s);
}
// consumers: [imports by module, body]
const cons = {
  v1: [{ InternalEvent: ['InternalEvent'] }, `InternalEvent.addListener(document, InternalEvent.CLICK, () => console.log('hit'));`],
  v2: [{ EventNames: ['EventNames'], InternalEvent: ['InternalEvent'] }, `InternalEvent.addListener(document, EventNames.CLICK, () => console.log('hit'));`],
  v3: [{ EventNames: ['EventNames'], InternalEvent: ['InternalEvent'] }, `InternalEvent.addListener(document, EventNames.CLICK, () => console.log('hit'));`],
  v4: [{ helper: ['f'] }, `console.log(f());`],
  v5: [{ EventNames: ['EventNames'] }, `EventNames.MY_EVENT = 'zzUSER_my';\nconsole.log(EventNames.CLICK, EventNames.MY_EVENT);`],
  v6: [{ EventNames: ['EventNames'], InternalEvent: ['InternalEvent'] }, `InternalEvent.addListener(document, EventNames.CLICK, () => console.log('hit'));`],
  v7: [{ EventNames: ['EventNames'], helper: ['getEventName'] }, `console.log(EventNames.CLICK, getEventName(document.title));`],
};
const variants = ['v1', 'v1es2022', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7'];
for (const v of variants) {
  const [imports, body] = cons[v.slice(0, 2)];
  const pkg = `lib-${v}`;
  const direct = Object.entries(imports).map(([m, ids]) => `import { ${ids.join(', ')} } from '${pkg}/${m}.js';`).join('\n');
  const barrel = `import { ${Object.values(imports).flat().join(', ')} } from '${pkg}';`;
  W(`entries/${v}-direct.js`, `${direct}\n${body}\n`);
  W(`entries/${v}-barrel.js`, `${barrel}\n${body}\n`);
}
