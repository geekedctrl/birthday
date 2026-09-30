const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

// Compile the actual TypeScript handlers, with isolated storage and HTTP adapters.
function load(file, dependencies, environment, fetchMock, logs) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', 'process', 'fetch', 'console', source)(
    name => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    module, module.exports, { env: environment, cwd: () => process.cwd() }, fetchMock,
    { error: message => logs.push(message) }
  );
  return module.exports;
}
function setup({ environment = {}, failWrite = false, status = 200, networkError = false } = {}) {
  const events = [], requests = [], logs = [];
  const fetchMock = async (url, options) => {
    events.push('notify'); requests.push({ url, ...options });
    if (networkError) throw new Error('network unavailable');
    return new Response('', { status });
  };
  const notifications = load('lib/notifications.ts', {}, environment, fetchMock, logs);
  const storage = {
    readFile: async () => '[]', mkdir: async () => {},
    writeFile: async (file) => {
      events.push(file.endsWith('.webm') ? 'audio' : 'metadata');
      if (failWrite && file.endsWith('.json')) throw new Error('disk unavailable');
    }
  };
  const route = load('app/api/reactions/route.ts', {
    fs: { promises: storage },
    'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
    '@/lib/notifications': notifications
  }, environment, fetchMock, logs);
  return { route, events, requests, logs };
}
function voiceRequest(type = 'audio/webm', data = 'test audio') {
  const form = new FormData();
  form.append('voice', new Blob([data], { type }), 'reaction.webm');
  form.append('text', 'PRIVATE REACTION TEXT');
  return new Request('http://localhost/api/reactions', { method: 'POST', body: form });
}
test('saved voice and text notify with the text only after audio and metadata are stored', async () => {
  const s = setup(); const result = await s.route.POST(voiceRequest());
  assert.equal(result.status, 200);
  assert.deepEqual(s.events, ['audio', 'metadata', 'notify']);
  assert.equal(s.requests.length, 1);
  assert.equal(s.requests[0].url, 'https://ntfy.sh/suba');
  assert.equal(s.requests[0].method, 'POST');
  assert.match(s.requests[0].body, /new audio and text message/);
  assert.ok(s.requests[0].body.includes('PRIVATE REACTION TEXT'));
  assert.ok(s.requests[0].signal instanceof AbortSignal);
});
test('JSON and multipart text or emoji submissions notify once after saving', async () => {
  for (const multipart of [false, true]) {
    for (const [body, kind] of [[{ text: 'PRIVATE REACTION TEXT' }, 'text message'], [{ emoji: 'heart' }, 'emoji reaction']]) {
      const s = setup();
      const form = new FormData();
      for (const [key, value] of Object.entries(body)) form.append(key, value);
      const request = new Request('http://localhost/api/reactions', multipart
        ? { method: 'POST', body: form }
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      assert.equal((await s.route.POST(request)).status, 200);
      assert.deepEqual(s.events, ['metadata', 'notify']);
      assert.equal(s.requests.length, 1);
      assert.ok(s.requests[0].headers.Title.endsWith(kind));
      if (body.text) assert.ok(s.requests[0].body.includes(body.text));
    }
  }
});
test('audio without text still sends an audio notification', async () => {
  const s = setup(); const form = new FormData();
  form.append('voice', new Blob(['test audio'], { type: 'audio/webm' }), 'reaction.webm');
  assert.equal((await s.route.POST(new Request('http://localhost/api/reactions', { method: 'POST', body: form }))).status, 200);
  assert.equal(s.requests.length, 1);
  assert.match(s.requests[0].body, /new audio message/);
});
test('blank text without another reaction does not save or notify', async () => {
  const s = setup();
  const result = await s.route.POST(new Request('http://localhost/api/reactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: '   ' }) }));
  assert.equal(result.status, 400); assert.deepEqual(s.events, []);
});
test('failed persistence does not send a false receipt', async () => {
  const s = setup({ failWrite: true });
  await assert.rejects(s.route.POST(voiceRequest()), /disk unavailable/);
  assert.equal(s.requests.length, 0);
});
test('ntfy HTTP failures preserve successful recording response', async () => {
  const s = setup({ status: 503 }); const result = await s.route.POST(voiceRequest());
  assert.equal(result.status, 200); assert.match(s.logs[0], /HTTP 503/);
});
test('network failure preserves successful recording response', async () => {
  const s = setup({ networkError: true }); const result = await s.route.POST(voiceRequest());
  assert.equal(result.status, 200); assert.equal(s.logs.length, 1);
});
test('empty, oversized, and non-audio uploads do not save or notify', async () => {
  for (const [type, body] of [['audio/webm', ''], ['text/plain', 'bad'], ['audio/webm', 'a'.repeat(5000001)]]) {
    const s = setup(); const result = await s.route.POST(voiceRequest(type, body));
    assert.equal(result.status, 400); assert.deepEqual(s.events, []);
  }
});
test('notification destination can be overridden on the server', async () => {
  const s = setup({ environment: { NTFY_TOPIC_URL: 'https://example.test/birthday' } });
  await s.route.POST(voiceRequest()); assert.equal(s.requests[0].url, 'https://example.test/birthday');
});
test('an explicitly blank destination disables notifications', async () => {
  const s = setup({ environment: { NTFY_TOPIC_URL: '' } });
  assert.equal((await s.route.POST(voiceRequest())).status, 200); assert.equal(s.requests.length, 0);
});

test('notification preserves message line breaks and Unicode without forwarding credentials or audio', async () => {
  const s = setup({ environment: { ADMIN_TOKEN: 'test-admin-secret' } });
  const text = 'I loved this!\nThank you so much ❤️';
  const result = await s.route.POST(new Request('http://localhost/api/reactions', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text })
  }));
  assert.equal(result.status, 200);
  assert.ok(s.requests[0].body.includes('\n\n' + text + '\n\n'));
  assert.ok(!JSON.stringify(s.requests).includes('test-admin-secret'));
  assert.equal(s.requests[0].headers.Attach, undefined);
});