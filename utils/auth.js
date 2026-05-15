const { EDGE_FUNCTION_URL, SUPABASE_ANON_KEY } = require('./config')

const STORAGE_KEYS = {
  accessToken: 'supabase_access_token',
  refreshToken: 'supabase_refresh_token',
  user: 'supabase_user',
  currentBabyId: 'current_baby_id',
}

function buildAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
  }
}

/** 业务表 PostgREST 请求：须同时带用户 JWT 与 anon apikey（RLS 依赖 auth.uid()） */
function buildUserAuthHeaders(accessToken) {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
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

function getCurrentBabyId(wxApi) {
  const api = getWxApi(wxApi)
  try {
    const id = api.getStorageSync(STORAGE_KEYS.currentBabyId)
    return id || null
  } catch (error) {
    return null
  }
}

function setCurrentBabyId(babyId, wxApi) {
  const api = getWxApi(wxApi)
  if (!babyId) {
    api.removeStorageSync(STORAGE_KEYS.currentBabyId)
  } else {
    api.setStorageSync(STORAGE_KEYS.currentBabyId, babyId)
  }
  try {
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.currentBabyId = babyId || null
    }
  } catch (e) {
    /* ignore */
  }
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
  api.removeStorageSync(STORAGE_KEYS.currentBabyId)
  try {
    const app = getApp()
    if (app && app.globalData) {
      app.globalData.session = null
      app.globalData.user = null
      app.globalData.currentBabyId = null
    }
  } catch (e) {
    /* 冷启动等时机 getApp 可能未就绪 */
  }
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
  buildUserAuthHeaders,
  clearStoredSession,
  getCurrentBabyId,
  setCurrentBabyId,
  getStoredSession,
  loginWithWeChat,
  normalizeSession,
  saveSession,
}
