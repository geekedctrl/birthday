const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function setup(saved) {
  const defaults = {
    birthdayConfig: { music: { vinyl: '' } },
    timeline: Array.from({ length: 10 }, (_, index) => ({ title: `Memory ${index}`, photo: null })),
    memories: [{ id: 'default', title: 'Default', photo: '/photos/original.jpg' }]
  };
  let stored = JSON.stringify(saved);
  const source = ts.transpileModule(fs.readFileSync('app/api/content/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const dependencies = {
    fs: { promises: { readFile: async () => stored, mkdir: async () => {}, writeFile: async (_, value) => { stored = value; } } },
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
    '@/lib/content': { defaultContent: defaults }
  };
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', source)(
    name => dependencies[name] ?? require(name), module, module.exports,
    { cwd: () => process.cwd(), env: { ADMIN_TOKEN: 'test-only' } }
  );
  return { route: module.exports, defaults };
}
test('cropped cinema images survive saving and loading without reverting to defaults', async () => {
  const { route } = setup({});
  const memories = [{ id: 'custom', title: 'My cropped memory', caption: 'Edited caption', photo: 'data:image/jpeg;base64,Y3JvcHBlZA==' }];
  const saved = await route.PUT(new Request('http://localhost/api/content', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-token': 'test-only' }, body: JSON.stringify({ memories })
  }));
  assert.equal(saved.status, 200);
  const loaded = await (await route.GET()).json();
  assert.deepEqual(loaded.memories, memories);
});
test('missing, empty, or invalid saved memories fall back to defaults', async () => {
  for (const memories of [undefined, null, [], 'invalid']) {
    const { route, defaults } = setup({ memories });
    assert.deepEqual((await (await route.GET()).json()).memories, defaults.memories);
  }
});
test('saved cinema photo paths are still normalized', async () => {
  const { route } = setup({ memories: [{ id: 'custom', photo: 'public/photos/custom.jpg' }] });
  assert.equal((await (await route.GET()).json()).memories[0].photo, '/photos/custom.jpg');
});
