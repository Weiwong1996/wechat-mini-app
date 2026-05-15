const assert = require('node:assert/strict')
const test = require('node:test')

const {
  buildAuthHeaders,
  buildUserAuthHeaders,
  loginWithWeChat,
  STORAGE_KEYS
} = require('../utils/auth')
const { SUPABASE_ANON_KEY } = require('../utils/config')

test('buildAuthHeaders includes Supabase anon key credentials', () => {
  assert.deepEqual(buildAuthHeaders(), {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  })
})

test('buildUserAuthHeaders uses access token and anon apikey', () => {
  assert.deepEqual(buildUserAuthHeaders('test-access-token'), {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: 'Bearer test-access-token'
  })
})

test('loginWithWeChat rejects when wx.login returns no code', async () => {
  const wxApi = {
    login: ({ success }) => success({}),
    request: () => {
      throw new Error('request should not run without code')
    }
  }

  await assert.rejects(
    () => loginWithWeChat({ wxApi }),
    /获取微信登录凭证失败/
  )
})

test('loginWithWeChat posts code to Edge Function and stores session', async () => {
  const stored = new Map()
  const wxApi = {
    login: ({ success }) => success({ code: 'wx-code-123' }),
    request: ({ url, method, header, data, success }) => {
      assert.match(url, /\/functions\/v1\/hyper-service$/)
      assert.equal(method, 'POST')
      assert.equal(header.Authorization, `Bearer ${SUPABASE_ANON_KEY}`)
      assert.deepEqual(data, { code: 'wx-code-123' })

      success({
        statusCode: 200,
        data: {
          access_token: 'access-token',
          refresh_token: 'refresh-token',
          user: { id: 'user-id' }
        }
      })
    },
    setStorageSync: (key, value) => stored.set(key, value)
  }

  const session = await loginWithWeChat({ wxApi })

  assert.equal(session.accessToken, 'access-token')
  assert.equal(session.refreshToken, 'refresh-token')
  assert.deepEqual(session.user, { id: 'user-id' })
  assert.equal(stored.get(STORAGE_KEYS.accessToken), 'access-token')
  assert.equal(stored.get(STORAGE_KEYS.refreshToken), 'refresh-token')
  assert.deepEqual(stored.get(STORAGE_KEYS.user), { id: 'user-id' })
})
