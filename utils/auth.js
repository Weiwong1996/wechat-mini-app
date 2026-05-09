const { EDGE_FUNCTION_URL, SUPABASE_ANON_KEY } = require('./config')

const STORAGE_KEYS = {
  accessToken: 'supabase_access_token',
  refreshToken: 'supabase_refresh_token',
  user: 'supabase_user'
}

function buildAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  }
}

function getWxApi(wxApi) {
  if (wxApi) return wxApi
  if (typeof wx !== 'undefined') return wx
  throw new Error('当前环境不支持微信小程序 API')
}

function loginByWx(wxApi) {
  return new Promise((resolve, reject) => {
    wxApi.login({
      success: resolve,
      fail: reject
    })
  })
}

function requestByWx(wxApi, options) {
  return new Promise((resolve, reject) => {
    wxApi.request({
      ...options,
      success: resolve,
      fail: reject
    })
  })
}

function normalizeSession(data) {
  if (!data || !data.access_token || !data.refresh_token) {
    throw new Error('登录响应异常')
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    user: data.user || null
  }
}

function saveSession(session, wxApi) {
  const api = getWxApi(wxApi)

  api.setStorageSync(STORAGE_KEYS.accessToken, session.accessToken)
  api.setStorageSync(STORAGE_KEYS.refreshToken, session.refreshToken)
  api.setStorageSync(STORAGE_KEYS.user, session.user)
}

function getStoredSession(wxApi) {
  const api = getWxApi(wxApi)

  try {
    const accessToken = api.getStorageSync(STORAGE_KEYS.accessToken)
    const refreshToken = api.getStorageSync(STORAGE_KEYS.refreshToken)
    const user = api.getStorageSync(STORAGE_KEYS.user)

    if (!accessToken || !refreshToken) return null

    return {
      accessToken,
      refreshToken,
      user: user || null
    }
  } catch (error) {
    return null
  }
}

function clearStoredSession(wxApi) {
  const api = getWxApi(wxApi)

  api.removeStorageSync(STORAGE_KEYS.accessToken)
  api.removeStorageSync(STORAGE_KEYS.refreshToken)
  api.removeStorageSync(STORAGE_KEYS.user)
}

async function loginWithWeChat(options = {}) {
  const wxApi = getWxApi(options.wxApi)
  const loginResult = await loginByWx(wxApi)
  const code = loginResult && loginResult.code

  if (!code) {
    throw new Error('获取微信登录凭证失败')
  }

  const response = await requestByWx(wxApi, {
    url: options.endpoint || EDGE_FUNCTION_URL,
    method: 'POST',
    header: buildAuthHeaders(),
    data: { code }
  })

  if (!response || response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error('登录服务暂不可用')
  }

  const session = normalizeSession(response.data)
  saveSession(session, wxApi)

  return session
}

module.exports = {
  STORAGE_KEYS,
  buildAuthHeaders,
  clearStoredSession,
  getStoredSession,
  loginWithWeChat,
  normalizeSession,
  saveSession
}
