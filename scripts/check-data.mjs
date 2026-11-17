import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function load(relative, mocks) {
  const exports = {}
  const js = ts.transpileModule(readFileSync(new URL(relative, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(js, { exports, process, require: (id) => mocks[id] ?? require(id) })
  return exports
}
const objects = new Map()
let version = 0, conflicts = 0, unavailable = false
const client = {
  async send(command) {
    const { Key, Body, IfMatch, IfNoneMatch, Prefix, ContinuationToken } = command.input
    const row = objects.get(Key)
    if (unavailable) throw Object.assign(new Error('Unavailable'), { $metadata: { httpStatusCode: 503 } })
    switch (command.constructor.name) {
      case 'GetObjectCommand':
        if (!row) throw Object.assign(new Error('Missing'), { $metadata: { httpStatusCode: 404 } })
        return { Body: { transformToString: async () => row.body }, ETag: row.etag }
      case 'PutObjectCommand':
        if ((IfMatch && IfMatch !== row?.etag) || (IfNoneMatch === '*' && row)) {
          conflicts++
          throw Object.assign(new Error('Changed'), { $metadata: { httpStatusCode: 412 } })
        }
        objects.set(Key, { body: Body, etag: `"${++version}"` })
        return {}
      case 'ListObjectsV2Command': {
        const keys = [...objects.keys()].filter((name) => name.startsWith(Prefix)).sort()
        const offset = Number(ContinuationToken ?? 0)
        return { Contents: keys.slice(offset, offset + 1).map((Key) => ({ Key })), IsTruncated: keys.length > offset + 1, NextContinuationToken: String(offset + 1) }
      }
      default: throw new Error(`Unexpected ${command.constructor.name}`)
    }
  },
}
const data = load('../lib/object-data.ts', { '@/lib/storage': { storageClient: () => client } })
const records = load('../lib/records.ts', { '@/lib/object-data': data })
assert.equal(await data.readData('missing'), null)
await assert.rejects(() => data.readData('../secret'))
await Promise.all([records.putEntry('xikun', '2026-11-17', { content: '保留我的日记' }), records.putEntry('jiaqi', '2026-11-17', { mood: 'happy' })])
assert(conflicts > 0)
assert.equal((await records.listEntries('2026-11')).length, 2)
await Promise.all([records.putEntry('xikun', '2026-11-17', { mood: 'love' }), records.putEntry('xikun', '2026-11-17', { content: '新的日记' })])
const entry = (await records.listEntries('2026-11')).find((item) => item.partner === 'xikun')
assert.equal(entry.mood, 'love')
assert.equal(entry.content, '新的日记')
const fields = { date: '2026-11-17', title: '那天', story: '合照故事' }
const photo = await records.putPhoto('xikun', 'photos/xikun/123.jpg', fields)
await records.putPhoto('xikun', 'photos/xikun/123.jpg', fields)
assert.equal((await records.listPhotos()).length, 1)
assert.equal(await records.editPhoto('jiaqi', photo.id, { ...fields, story: '不应改写' }), null)
await records.editPhoto('xikun', photo.id, { ...fields, story: '修改完成' })
assert.equal((await records.listPhotos())[0].story, '修改完成')
await records.editPhoto('xikun', photo.id, null)
assert.equal((await records.listPhotos()).length, 0)
const note = { from: 'xikun', to: 'jiaqi', date: '2026-11-17', kind: 'note', content: '你好', readAt: null, updatedAt: new Date().toISOString() }
await records.editNote('xikun', note.date, () => note)
await records.editNote('jiaqi', '2026-10-17', () => ({ ...note, date: '2026-10-17', from: 'jiaqi', to: 'xikun' }))
assert.equal((await records.listNotes()).length, 2)
await records.editNote('xikun', note.date, (current) => ({ ...current, readAt: 'read' }))
assert.equal((await records.listNotes('2026-11'))[0].readAt, 'read')
await records.editNote('xikun', note.date, () => null)
assert.equal((await records.listNotes('2026-11')).length, 0)
await Promise.all([records.createCapsule({ author: 'xikun', to: 'partner', openDate: '2027-01-01', title: '', content: '未来的信' }), records.createCapsule({ author: 'jiaqi', to: 'both', openDate: '2027-01-01', title: '', content: '未来的我们' })])
assert.equal((await records.listCapsules()).length, 2)
assert((await records.listCapsules()).every((item) => Number.isSafeInteger(item.id)))
unavailable = true
await assert.rejects(() => records.listPhotos(), /Unavailable/)
await assert.rejects(() => records.putEntry('xikun', '2026-11-17', { content: '不能覆盖' }), /Unavailable/)
unavailable = false
assert.equal((await records.listEntries('2026-11')).find((item) => item.partner === 'xikun').content, '新的日记')
console.log('Object data checks passed: concurrent merges, paginated reads, photo ownership, notes, capsules and fail-closed storage errors.')
