import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function load(relative, mocks = {}, globals = {}) {
  const exports = {}
  const js = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(js, { exports, require: (id) => id in mocks ? mocks[id] : require(id), console: { error() {} }, ...globals })
  return exports
}
const helpers = load('../lib/photos.ts')
assert(helpers.validPhotoDate('2024-02-29'))
for (const value of ['2026-02-29', '2026-02-31', '2026-13-01', 'bad', null]) assert(!helpers.validPhotoDate(value))
const pathname = 'photos/xikun/1234-abcd.jpg'
assert(helpers.isPhotoPath(pathname, 'xikun'))
for (const value of [pathname.replace('xikun', 'jiaqi'), 'photos/xikun/../other.jpg', 'diary/xikun/photo.jpg', 'https://example.com/a.jpg']) assert(!helpers.isPhotoPath(value, 'xikun'))
const fields = { date: '2026-11-17', title: ' 那天的晚风 ', story: ' 故事。 ' }
assert.equal(helpers.photoFields(fields).title, '那天的晚风')
assert.equal(helpers.photoFields({ ...fields, story: 'a'.repeat(3001) }), null)
assert.equal(helpers.photoFields({ ...fields, title: 'a'.repeat(41) }), null)

let partner = null, writes = 0, stored = [], values, editOwner, deletedBlob
const photo = { id: 1, author: 'xikun', pathname, ...fields }
const records = {
  listPhotos: async () => stored,
  putPhoto: async (author, pathname, fields) => { writes++; values = { author, pathname, ...fields }; return photo },
  editPhoto: async (author, id) => { writes++; editOwner = author; return stored.find((item) => item.id === id && item.author === author) ?? null },
}
const api = load('../app/api/photos/route.ts', {
  '@/lib/photos': helpers,
  '@/lib/identity': { getCurrentPartner: async () => partner ? { partner } : null },
  '@/lib/records': records,
  '@/lib/time': { todayInChina: () => '2026-11-17' },
  '@/lib/storage': { deleteImage: async (p) => { deletedBlob = p } },
  'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
})
const req = (body) => ({ json: async () => body })
assert.equal((await api.GET()).status, 401)
for (const method of ['POST', 'PATCH', 'DELETE']) assert.equal((await api[method](req({}))).status, 401)
partner = 'xikun'
assert.equal((await api.POST(req({ ...fields, pathname: 'photos/jiaqi/123.jpg' }))).status, 400)
assert.equal((await api.POST(req({ ...fields, pathname, date: '2026-11-18' }))).status, 400)
assert.equal((await api.PATCH(req({ ...fields, id: -1 }))).status, 400)
assert.equal((await api.DELETE(req({ id: '1' }))).status, 400)
assert.equal(writes, 0)
assert.equal((await api.POST(req({ ...fields, pathname, author: 'jiaqi' }))).status, 201)
assert.equal(values.author, 'xikun')
assert.equal((await api.PATCH(req({ ...fields, id: 1 }))).status, 403)
assert.equal(editOwner, 'xikun')
stored = [photo]
assert.equal((await api.PATCH(req({ ...fields, id: 1 }))).status, 200)
assert.equal((await api.DELETE(req({ id: 1 }))).status, 200)
assert.equal(deletedBlob, pathname)
assert.equal((await api.GET()).status, 200)
console.log('Photo validation and API authorization checks passed.')

let blobReads = 0
const storagePaths = load('../lib/storage-paths.ts')
class TestResponse extends Response { static json(data, init) { return Response.json(data, init) } }
const files = load('../app/api/file/route.ts', {
  '@/lib/photos': helpers, '@/lib/records': records,
  '@/lib/identity': { getCurrentPartner: async () => partner ? { partner } : null, canReadPartner: async () => ({ canRead: false }) },
  '@/lib/storage-paths': storagePaths,
  '@/lib/storage': { signImage: async () => { blobReads++; return 'https://zjq.cn-nb1.rains3.com/signed-image' } },
  'next/server': { NextResponse: TestResponse },
})
const fileRequest = (path) => ({ nextUrl: new URL(`https://example.test/api/file?pathname=${encodeURIComponent(path)}`), headers: new Headers() })
partner = null
assert.equal((await files.GET(fileRequest(pathname))).status, 401)
partner = 'xikun'
assert.equal((await files.GET(fileRequest('photos/xikun/../secret.jpg'))).status, 400)
assert.equal((await files.GET(fileRequest('diary/jiaqi/private.jpg'))).status, 403)
assert.equal(blobReads, 0)
const signed = await files.GET(fileRequest(pathname))
assert.equal(signed.status, 200)
assert.equal((await signed.json()).url, 'https://zjq.cn-nb1.rains3.com/signed-image')
assert.equal(signed.headers.get('Cache-Control'), 'private, no-store')
stored = []
assert.equal((await files.GET(fileRequest(pathname))).status, 404)
assert.equal(blobReads, 1)
assert.equal((await files.GET(fileRequest('diary/xikun/private.jpg'))).status, 200)
console.log('Private photo access, removed-photo access, and diary lock checks passed.')

for (const path of ['https://evil.test/a.png', 'diary/xikun/../a.jpg', 'photos/jiaqi/a.svg', 'diary/stranger/a.jpg']) assert(!storagePaths.isStoragePath(path))
const metadata = { type: 'image/png', size: 128, purpose: 'photos' }
for (const size of [0, -1, NaN, 1.5, 8 * 1024 * 1024 + 1]) assert.equal(storagePaths.uploadMetadata({ ...metadata, size }), null)
assert.equal(storagePaths.uploadMetadata({ ...metadata, type: 'image/svg+xml' }), null)
assert.equal(storagePaths.uploadMetadata({ ...metadata, purpose: '../diary' }), null)
let signedUpload
const uploads = load('../app/api/upload/route.ts', {
  '@/lib/identity': { getCurrentPartner: async () => partner ? { partner } : null },
  '@/lib/storage-paths': storagePaths,
  '@/lib/storage': { signUpload: async (...args) => { signedUpload = args; return 'https://zjq.cn-nb1.rains3.com/signed-upload' } },
  'next/server': { NextResponse: TestResponse },
})
partner = null
assert.equal((await uploads.POST(req(metadata))).status, 401)
partner = 'xikun'
assert.equal((await uploads.POST(req({ ...metadata, size: -1 }))).status, 400)
assert.equal(signedUpload, undefined)
const upload = await uploads.POST(req({ ...metadata, partner: 'jiaqi' }))
assert.equal(upload.status, 200)
const uploadData = await upload.json()
assert(uploadData.pathname.startsWith('photos/xikun/'))
assert.equal(signedUpload[1], 'image/png')
assert.equal(signedUpload[2], 128)

const transfers = []
const clientUpload = load('../lib/upload-image.ts', { '@/lib/storage-paths': storagePaths }, {
  fetch: async (url, options) => {
    transfers.push({ url, options })
    return url === '/api/upload' ? Response.json(uploadData) : new Response(null, { status: 200 })
  },
})
const file = new File(['test image'], 'image.png', { type: 'image/png' })
assert.equal(await clientUpload.uploadImage(file, 'photos'), uploadData.pathname)
assert.equal(transfers.length, 2)
assert.equal(transfers[0].options.headers['Content-Type'], 'application/json')
assert.equal(JSON.parse(transfers[0].options.body).size, file.size)
assert.equal(transfers[1].url, uploadData.uploadUrl)
assert.equal(transfers[1].options.method, 'PUT')
assert.equal(transfers[1].options.body, file)
assert.equal(transfers[1].options.credentials, 'omit')
console.log('Direct upload validation and zero-proxy file transfer checks passed.')
