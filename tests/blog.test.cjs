const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(relative, mocks = {}) {
  const filename = path.resolve(relative);
  const module = new Module(filename);
  module.filename = filename;
  module.paths = Module._nodeModulePaths(path.dirname(filename));
  const requireModule = module.require.bind(module);
  module.require = name => Object.hasOwn(mocks, name) ? mocks[name] : requireModule(name);
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText, filename);
  return module.exports;
}
const markup = load('lib/blog-markup.ts');
const { compilePost, MarkupError } = markup;
const media = ['photo-1', 'photo-2', 'video-1', 'audio-1', 'file-1'].map((ref, index) => ({
  ref, type: ref.split('-')[0] === 'file' ? 'document' : ref.split('-')[0], fileId: `public-${index}`,
  telegramFileId: `private-${index}`, messageId: index, fileName: 'example.pdf',
}));

test('rich content has a shared title, safe body, lists and tables', () => {
  const result = compilePost('<h1>Привіт &amp; світ</h1><tags>python, python, життя</tags><excerpt>Опис</excerpt><p><b>Жирний</b><i>Курсив</i></p><ol><li>Крок</li></ol><table><thead><tr><th>Назва</th></tr></thead><tbody><tr><td>Значення</td></tr></tbody></table>');
  assert.equal(result.title, 'Привіт & світ');
  assert.deepEqual(result.tags, ['python', 'життя']);
  assert.equal(result.excerpt, 'Опис');
  assert.ok(!result.html.includes('<h1>'));
  assert.ok(!result.html.includes('<tags>'));
  assert.ok(result.telegramHtml.includes('<h1>Привіт &amp; світ</h1>'));
  assert.ok(!result.telegramHtml.includes('<tbody>'));
  assert.ok(result.html.includes('<tbody>'));
});
test('attachment position and album order are preserved without revealing file_id', () => {
  const result = compilePost('<h1>Медіа</h1><p>До</p><gallery refs="photo-2,photo-1"/><p>Після</p><video ref="video-1"/><audio ref="audio-1"/><file ref="file-1" title="PDF"/>', media);
  assert.ok(result.html.indexOf('public-1') < result.html.indexOf('public-0'));
  assert.ok(result.html.indexOf('Після') < result.html.indexOf('<video'));
  assert.ok(!result.html.includes('private-'));
  assert.ok(result.telegramHtml.includes('tg://document?id=file-1'));
  assert.equal(result.media.length, 5);
});
test('missing and mistyped attachment refs fail before publication', () => {
  assert.throws(() => compilePost('<h1>Test</h1><img ref="photo-9"/>', media), MarkupError);
  assert.throws(() => compilePost('<h1>Test</h1><video ref="photo-1"/>', media), MarkupError);
});
test('scripts, unsafe links and executable attributes cannot reach the website', () => {
  for (const source of ['<h1>Test</h1><script>alert(1)</script>', '<h1>Test</h1><a href="javascript:alert(1)">click</a>', '<h1>Test</h1><iframe/>']) {
    assert.throws(() => compilePost(source), MarkupError);
  }
  const result = compilePost('<h1 onclick="bad()">Test</h1><p style="color:red" onmouseover="bad()">Safe</p><img ref="photo-1" onerror="bad()" src="https://evil.example"/>', media);
  assert.ok(!result.html.includes('bad'));
  assert.ok(!result.html.includes('evil'));
  assert.ok(!result.html.includes('style='));
});
test('rejects oversized/deep content, media in paragraphs and block content in cells', () => {
  assert.throws(() => compilePost(`<h1>Test</h1><p>${'x'.repeat(32000)}</p>`), MarkupError);
  assert.throws(() => compilePost('<h1>Test</h1>' + '<details>'.repeat(18) + 'x' + '</details>'.repeat(18)), MarkupError);
  assert.throws(() => compilePost('<h1>Test</h1><p><img ref="photo-1"/></p>', media), MarkupError);
  assert.throws(() => compilePost('<h1>Test</h1><table><tr><td><p>block</p></td></tr></table>'), MarkupError);
  assert.throws(() => compilePost('<h1>Test</h1><table><tr>' + '<td>x</td>'.repeat(21) + '</tr></table>'), MarkupError);
  assert.throws(() => compilePost('<h1>Test</h1><h1>Another</h1>'), MarkupError);
});

// Minimal durable collection double: reads return snapshots just like MongoDB.
function collection() {
  const documents = new Map();
  function values(doc, key) { return key.split('.').reduce((items, part) => items.flatMap(item => Array.isArray(item) ? item.map(value => value?.[part]) : [item?.[part]]), [doc]); }
  function matches(doc, query) {
    return Object.entries(query).every(([key, condition]) => {
      if (key === '$or') return condition.some(query => matches(doc, query));
      const found = values(doc, key);
      if (condition && typeof condition === 'object') {
        if ('$ne' in condition) return found.every(value => value !== condition.$ne);
        if ('$exists' in condition) return found.some(value => value !== undefined) === condition.$exists;
        if ('$lte' in condition) return found.some(value => value <= condition.$lte);
      }
      return found.some(value => value === condition);
    });
  }
  function update(query, change, options = {}) {
    let doc = [...documents.values()].find(doc => matches(doc, query));
    if (!doc && options.upsert) {
      doc = { _id: query._id || query.publicationKey, ...change.$setOnInsert };
      documents.set(doc._id, doc);
    }
    if (!doc) return null;
    Object.assign(doc, change.$set);
    for (const [key, value] of Object.entries(change.$push || {})) (doc[key] ||= []).push(value);
    return structuredClone(doc);
  }
  return { documents, find: query => {
    let result = [...documents.values()].filter(doc => matches(doc, query));
    const cursor = { sort: () => cursor, skip: n => { result = result.slice(n); return cursor; }, limit: n => { result = result.slice(0,n); return cursor; }, toArray: async () => structuredClone(result) }; return cursor;
  }, findOne: async query => structuredClone([...documents.values()].find(doc => matches(doc, query)) || null),
    updateOne: async (query, change, options) => update(query, change, options),
    findOneAndUpdate: async (query, change, options) => update(query, change, options) };
}
function publisherFixture(channelError, templateError) {
  const collections = new Map();
  const db = { collection: name => { if (!collections.has(name)) collections.set(name, collection()); return collections.get(name); } };
  const calls = [];
  class TelegramError extends Error {}
  const api = { TelegramError, telegramFile: async () => '', telegram: async (method, payload) => {
    calls.push({ method, payload });
    if (method === 'sendMessage' && payload.text.includes('ПРОМПТ ДЛЯ LLM') && templateError) throw templateError === 'rejected' ? new TelegramError('Rejected') : new Error('Disconnected');
    if (method === 'sendRichMessage' && channelError) throw channelError === 'rejected' ? new TelegramError('Rejected') : new Error('Disconnected');
    return { message_id: 123 };
  } };
  const publisher = load('lib/telegram-publisher.ts', {
    './mongodb': { connectToDatabase: async () => ({ connection: { db } }) }, './blog-markup': markup,
    './telegram-template': { readBlogTemplate: async () => fs.readFileSync('public/blog-template.txt', 'utf8') },
    './telegram-api': api, '@/app/models/Post': { updateOne: (...args) => db.collection('posts').updateOne(...args) },
  });
  process.env.TELEGRAM_OWNER_ID = '42'; process.env.SITE_URL = 'https://portfolio.example'; process.env.TELEGRAM_CHANNEL_ID = '@channel';
  const send = (id, content) => publisher.handleBotUpdate({ update_id: id, message: { message_id: id, from: { id: 42 }, chat: { id: 42, type: 'private' }, ...content } });
  return { publisher, db, calls, send };
}
test('bot ignores strangers and accepts only the owner private chat', async () => {
  const { publisher, calls } = publisherFixture();
  await publisher.handleBotUpdate({ update_id: 1, message: { message_id: 1, from: { id: 7 }, chat: { id: 7, type: 'private' }, text: '/new' } });
  assert.equal(calls.length, 0);
  assert.equal(publisher.authorizedMessage({ message: { from: { id: 42 }, chat: { id: -42, type: 'group' } } }), false);
});
test('whole draft publishes once despite repeated updates and /publish', async () => {
  const { db, calls, send } = publisherFixture();
  await send(1, { text: '/new' });
  await send(2, { text: '<h1>Title</h1><p>Text</p><img ref="photo-1"/>' });
  await send(3, { photo: [{ file_id: 'private-photo', file_size: 1000 }] });
  await send(3, { photo: [{ file_id: 'private-photo', file_size: 1000 }] });
  await send(4, { text: '/publish' });
  await send(4, { text: '/publish' });
  await send(5, { text: '/publish' });
  assert.equal(db.collection('posts').documents.size, 1);
  assert.equal(calls.filter(call => call.method === 'sendRichMessage').length, 1);
  const draft = [...db.collection('bot_drafts').documents.values()][0];
  assert.equal(draft.attachments.length, 1);
  assert.equal(draft.channelState, 'sent');
  assert.equal(draft.locked, false);
  const rich = calls.find(call => call.method === 'sendRichMessage').payload.rich_message;
  assert.equal(rich.media[0].media.media, 'private-photo');
  assert.ok(rich.html.includes('tg://photo?id=photo-1'));
});
test('missing attachment prevents both destinations from publishing', async () => {
  const { db, calls, send } = publisherFixture();
  await send(1, { text: '/new' }); await send(2, { text: '<h1>Title</h1><img ref="photo-1"/>' }); await send(3, { text: '/publish' });
  assert.equal(db.collection('posts').documents.size, 0);
  assert.equal(calls.filter(call => call.method === 'sendRichMessage').length, 0);
});
test('explicit Telegram rejection can retry without duplicating website post', async () => {
  const { db, calls, send } = publisherFixture('rejected');
  await send(1, { text: '/new' }); await send(2, { text: '<h1>Title</h1><p>Text</p>' });
  await send(3, { text: '/publish' });
  await send(4, { text: '<h1>Corrected</h1><p>Updated text</p>' });
  await send(5, { text: '/publish' });
  assert.equal(db.collection('posts').documents.size, 1);
  assert.equal(calls.filter(call => call.method === 'sendRichMessage').length, 2);
  assert.equal([...db.collection('bot_drafts').documents.values()][0].channelState, 'pending');
  assert.equal([...db.collection('posts').documents.values()][0].title, 'Corrected');
});
test('ambiguous delivery is blocked instead of blindly creating duplicate channel post', async () => {
  const { db, calls, send } = publisherFixture('connection');
  await send(1, { text: '/new' }); await send(2, { text: '<h1>Title</h1><p>Text</p>' });
  await send(3, { text: '/publish' }); await send(4, { text: '/publish' }); await send(5, { text: '/new' });
  assert.equal(db.collection('posts').documents.size, 1);
  assert.equal(db.collection('bot_drafts').documents.size, 1);
  assert.equal(calls.filter(call => call.method === 'sendRichMessage').length, 1);
  assert.equal([...db.collection('bot_drafts').documents.values()][0].channelState, 'uncertain');
});

test('webhook rejects missing and incorrect secrets before processing updates', async () => {
  let processed = 0;
  const route = load('app/api/telegram/webhook/route.ts', { '@/lib/telegram-publisher': { handleBotUpdate: async () => { processed++; } } });
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  assert.equal((await route.POST(new Request('https://site.example/api/telegram/webhook', { method: 'POST', body: '{}' }))).status, 503);
  process.env.TELEGRAM_WEBHOOK_SECRET = 'test-secret';
  const request = secret => new Request('https://site.example/api/telegram/webhook', {
    method: 'POST', headers: { 'x-telegram-bot-api-secret-token': secret }, body: JSON.stringify({ update_id: 1 }),
  });
  assert.equal((await route.POST(request('bad-secret'))).status, 401);
  assert.equal(processed, 0);
  assert.equal((await route.POST(request('test-secret'))).status, 200);
  assert.equal(processed, 1);
});

test('media proxy streams Telegram bytes, hides token and forwards range headers', async () => {
  const { NextRequest } = require('next/server');
  const fakeMedia = { fileId: 'public-media', telegramFileId: 'private-media', mimeType: 'video/mp4', type: 'video' };
  const route = load('app/api/media/[id]/route.ts', {
    '@/lib/models': { Post: { findOne: async () => ({ media: [fakeMedia] }) }, MediaFile: {} },
    '@/lib/mongodb': { connectToDatabase: async () => {} },
    '@/lib/telegram-api': { telegramFile: async id => { assert.equal(id, 'private-media'); return 'https://api.telegram.org/file/botSECRET/video.mp4'; } },
  });
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.ok(url.includes('botSECRET'));
    assert.equal(options.headers.get('Range'), 'bytes=0-3');
    return new Response('data', { status: 206, headers: { 'Content-Range': 'bytes 0-3/8', 'Accept-Ranges': 'bytes', 'Content-Length': '4' } });
  };
  try {
    const response = await route.GET(new NextRequest('https://site.example/api/media/public-media', { headers: { Range: 'bytes=0-3' } }), { params: Promise.resolve({ id: 'public-media' }) });
    assert.equal(response.status, 206);
    assert.equal(await response.text(), 'data');
    assert.equal(response.headers.get('Content-Range'), 'bytes 0-3/8');
    assert.equal(response.headers.get('Location'), null);
    assert.ok(![...response.headers.values()].join(' ').includes('SECRET'));
  } finally { global.fetch = originalFetch; }
});

test('template sends a copyable prompt as one plain message, once per update', async () => {
  const { calls, send } = publisherFixture();
  await send(10, { text: '/template' });
  await send(10, { text: '/template' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'sendMessage');
  assert.ok(calls[0].payload.text.includes('<h1>'));
  assert.ok(calls[0].payload.text.includes('ПРОМПТ ДЛЯ LLM'));
  assert.ok(calls[0].payload.text.length <= 4096);
  assert.equal(calls[0].payload.parse_mode, undefined);
});

test('start only explains commands and never triggers a template upload', async () => {
  const { calls, send } = publisherFixture();
  await send(11, { text: '/start' });
  await send(11, { text: '/start' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'sendMessage');
});

test('failed template delivery is acknowledged without repeating replies or blocking new drafts', async () => {
  for (const failure of ['rejected', 'connection']) {
    const { calls, send, db } = publisherFixture(null, failure);
    await send(12, { text: '/template' });
    await send(12, { text: '/template' });
    await send(13, { text: '/new' });
    assert.equal(calls.filter(call => call.payload.text?.includes('ПРОМПТ ДЛЯ LLM')).length, 1);
    assert.equal(db.collection('bot_updates').documents.get(12).done, true);
    assert.equal(db.collection('bot_drafts').documents.size, 1);
    assert.equal(calls.filter(call => call.method === 'sendMessage').length, failure === 'rejected' ? 3 : 2);
  }
});

test('telegram transport sends multipart uploads without a JSON content type', async () => {
  const api = load('lib/telegram-api.ts');
  const originalFetch = global.fetch;
  process.env.TELEGRAM_BOT_TOKEN = 'test-only-token';
  const form = new FormData();
  form.set('document', new Blob(['template']), 'blog-template.txt');
  global.fetch = async (_url, options) => {
    assert.equal(options.body, form);
    assert.equal(options.headers, undefined);
    return Response.json({ ok: true, result: { message_id: 1 } });
  };
  try { assert.equal((await api.telegram('sendDocument', form)).message_id, 1); }
  finally { global.fetch = originalFetch; delete process.env.TELEGRAM_BOT_TOKEN; }
});


test('HTML message fragments append once and a new h1 replaces the article text', async () => {
  const { send, db } = publisherFixture();
  await send(100, { text: '/new' });
  await send(101, { text: '```html\n<h1>Title</h1><p>First</p>\n```' });
  await send(102, { text: '<p>Second</p>' });
  await send(102, { text: '<p>Second</p>' });
  const draft = () => [...db.collection('bot_drafts').documents.values()][0];
  assert.equal(draft().source, '<h1>Title</h1><p>First</p>\n<p>Second</p>');
  await send(103, { text: '<h1>Replacement</h1><p>New</p>' });
  assert.equal(draft().source, '<h1>Replacement</h1><p>New</p>');
});

const callback = (fixture, update_id, data, owner = 42) => fixture.publisher.handleBotUpdate({ update_id, callback_query: { id: `cb${update_id}`, from: { id: owner }, data, message: { message_id: 900, from: { id: 999 }, chat: { id: 42, type: 'private' } } } });

test('editing preserves URL and media and updates the existing channel message once', async () => {
  const f = publisherFixture();
  await f.send(1, { text: '/new' }); await f.send(2, { text: '<h1>Title</h1><img ref="photo-1"/>' }); await f.send(3, { photo: [{ file_id: 'private-photo' }] }); await f.send(4, { text: '/publish' });
  const old = [...f.db.collection('bot_drafts').documents.values()][0];
  await callback(f, 5, `edit:${old._id}`, 7);
  assert.equal([...f.db.collection('bot_drafts').documents.values()][0].editing, false);
  await f.send(6, { text: '/posts' });
  assert.ok(f.calls.some(c => c.payload.reply_markup?.inline_keyboard[0][0].text === 'Редагувати'));
  await callback(f, 7, `edit:${old._id}`);
  await f.send(8, { text: '<h1>Changed</h1><img ref="photo-1"/>' }); await f.send(9, { text: '/publish' }); await f.send(9, { text: '/publish' });
  const post = [...f.db.collection('posts').documents.values()][0];
  assert.equal(post.slug, old.slug); assert.equal(post.title, 'Changed'); assert.equal(post.media[0].telegramFileId, 'private-photo');
  assert.equal(f.calls.filter(c => c.method === 'sendRichMessage').length, 1);
  const edits = f.calls.filter(c => c.method === 'editMessageText'); assert.equal(edits.length, 1); assert.equal(edits[0].payload.message_id, 123);
});
test('deletion requires a current confirmation, is idempotent and cannot be republished', async () => {
  const f = publisherFixture(); await f.send(1, { text: '/new' }); await f.send(2, { text: '<h1>Title</h1><p>Text</p>' }); await f.send(3, { text: '/publish' });
  const draft = [...f.db.collection('bot_drafts').documents.values()][0];
  await callback(f, 4, `confirm:${draft._id}:invalid`); assert.equal(f.calls.filter(c => c.method === 'deleteMessage').length, 0);
  await callback(f, 5, `delete:${draft._id}`); assert.equal(f.calls.filter(c => c.method === 'deleteMessage').length, 0);
  const token = [...f.db.collection('bot_drafts').documents.values()][0].deleteToken;
  await callback(f, 6, `confirm:${draft._id}:${token}`); await callback(f, 7, `confirm:${draft._id}:${token}`); await f.send(8, { text: '/publish' });
  assert.equal(f.calls.filter(c => c.method === 'deleteMessage').length, 1);
  assert.equal([...f.db.collection('posts').documents.values()][0].deleted, true);
  assert.equal(f.calls.filter(c => c.method === 'sendRichMessage').length, 1);
});
test('article lookup decodes Cyrillic route params and excludes deleted articles', async () => {
  let query;
  const posts = load('lib/posts.ts', { '@/app/models/Post': { findOne: q => { query = q; return { select: () => ({ lean: async () => ({ slug: q.slug }) }) }; } }, '@/lib/mongodb': { connectToDatabase: async () => {} } });
  const slug = 'як-я-виграв-приз';
  assert.equal((await posts.getPost(encodeURIComponent(slug))).slug, slug);
  assert.deepEqual(query.deleted, { $ne: true });
  assert.equal(posts.normalizePostSlug('%broken'), '%broken');
});
