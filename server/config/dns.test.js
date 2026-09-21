import test from 'node:test'
import assert from 'node:assert/strict'
import { createDatabaseLookup } from './dns.js'

const lookup = (fn, hostname, options) => new Promise((resolve, reject) => {
  fn(hostname, options, (error, address, family) => error ? reject(error) : resolve({ address, family }))
})
const resolver = {
  resolve4: (_, cb) => cb(null, ['192.0.2.1']),
  resolve6: (_, cb) => cb(Object.assign(new Error('No AAAA record'), { code: 'ENODATA' })),
}

test('Atlas socket lookup uses DNS override and supports all addresses', async () => {
  const fn = createDatabaseLookup(resolver, () => assert.fail('Used system DNS'))
  assert.deepEqual(await lookup(fn, 'shard.mongodb.net', { all: true }), {
    address: [{ address: '192.0.2.1', family: 4 }], family: undefined,
  })
  assert.deepEqual(await lookup(fn, 'shard.mongodb.net', { family: 4 }), { address: '192.0.2.1', family: 4 })
})

test('honors IPv6-only requests and surfaces DNS failure', async () => {
  await assert.rejects(lookup(createDatabaseLookup(resolver), 'shard.mongodb.net', { family: 6 }), { code: 'ENODATA' })
})

test('local database names still use system DNS', async () => {
  const fn = createDatabaseLookup(resolver, (hostname, options, cb) => {
    assert.equal(hostname, 'localhost')
    cb(null, '127.0.0.1', 4)
  })
  assert.deepEqual(await lookup(fn, 'localhost', {}), { address: '127.0.0.1', family: 4 })
})
