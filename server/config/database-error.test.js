import test from 'node:test'
import assert from 'node:assert/strict'
import { databaseErrorHint, isConnectionReset } from './database-error.js'

test('detects nested server selection reset', () => {
  const error = { reason: { servers: new Map([['host', { error: {
    message: 'TLS socket failed', cause: { code: 'ECONNRESET' },
  } }]]) } }
  assert.equal(isConnectionReset(error), true)
  assert.match(databaseErrorHint(error), /ECONNRESET/)
})

test('does not classify auth and certificate errors as resets', () => {
  assert.equal(isConnectionReset({ code: 18, message: 'Authentication failed' }), false)
  assert.equal(isConnectionReset({ message: 'certificate expired' }), false)
})

test('handles circular causes', () => {
  const error = new Error('querySrv ENOTFOUND')
  error.cause = error
  assert.equal(isConnectionReset(error), false)
  assert.match(databaseErrorHint(error), /DNS lookup failed/)
})

test('missing production URI gives configuration instructions', () => {
  assert.match(databaseErrorHint(new Error('MONGODB_URI is required.')), /MONGODB_URI is missing.*Hostinger/)
})

test('invalid URI diagnostics do not expose supplied credentials', () => {
  const hint = databaseErrorHint({ name: 'MongoParseError', message: 'Invalid scheme mongodb+srv://user:private-password@host' })
  assert.match(hint, /MONGODB_URI is invalid/)
  assert.doesNotMatch(hint, /private-password/)
})

test('connection timeout and refusal get distinct diagnostics', () => {
  assert.match(databaseErrorHint({ cause: { code: 'ETIMEDOUT' } }), /connection timed out/)
  assert.match(databaseErrorHint({ cause: { code: 'ECONNREFUSED' } }), /refused the connection/)
})
