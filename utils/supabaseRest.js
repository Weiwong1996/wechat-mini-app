const { SUPABASE_URL } = require('./config')
const { buildUserAuthHeaders } = require('./auth')

function getWxApi(wxApi) {
  if (wxApi) return wxApi
  if (typeof wx !== 'undefined') return wx
  throw new Error('当前环境不支持微信小程序 API')
}

function extractErrorMessage(res) {
  const d = res.data
  if (d && typeof d.message === 'string') return d.message
  if (d && typeof d.error_description === 'string') return d.error_description
  if (d && typeof d.hint === 'string' && d.message) return `${d.message} (${d.hint})`
  if (typeof d === 'string') return d
  return `请求失败 (${res.statusCode})`
}

/**
 * PostgREST：`path` 为 `表名?查询串`（含 select / 过滤 / order）。
 */
function userGet(wxApi, accessToken, path) {
  const api = getWxApi(wxApi)
  return new Promise((resolve, reject) => {
    api.request({
      url: `${SUPABASE_URL}/rest/v1/${path}`,
      method: 'GET',
      header: buildUserAuthHeaders(accessToken),
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const err = new Error(extractErrorMessage(res))
          err.statusCode = res.statusCode
          err.body = res.data
          reject(err)
        }
      },
      fail: reject,
    })
  })
}

function userPost(wxApi, accessToken, table, body, options = {}) {
  const api = getWxApi(wxApi)
  const header = { ...buildUserAuthHeaders(accessToken) }
  if (options.prefer) {
    header.Prefer = options.prefer
  }
  return new Promise((resolve, reject) => {
    api.request({
      url: `${SUPABASE_URL}/rest/v1/${table}`,
      method: 'POST',
      header,
      data: body,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const err = new Error(extractErrorMessage(res))
          err.statusCode = res.statusCode
          err.body = res.data
          reject(err)
        }
      },
      fail: reject,
    })
  })
}

function userPatch(wxApi, accessToken, pathWithQuery, body) {
  const api = getWxApi(wxApi)
  return new Promise((resolve, reject) => {
    api.request({
      url: `${SUPABASE_URL}/rest/v1/${pathWithQuery}`,
      method: 'PATCH',
      header: {
        ...buildUserAuthHeaders(accessToken),
        Prefer: 'return=representation',
      },
      data: body,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const err = new Error(extractErrorMessage(res))
          err.statusCode = res.statusCode
          err.body = res.data
          reject(err)
        }
      },
      fail: reject,
    })
  })
}

function userDelete(wxApi, accessToken, pathWithQuery) {
  const api = getWxApi(wxApi)
  return new Promise((resolve, reject) => {
    api.request({
      url: `${SUPABASE_URL}/rest/v1/${pathWithQuery}`,
      method: 'DELETE',
      header: buildUserAuthHeaders(accessToken),
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const err = new Error(extractErrorMessage(res))
          err.statusCode = res.statusCode
          err.body = res.data
          reject(err)
        }
      },
      fail: reject,
    })
  })
}

module.exports = {
  userGet,
  userPost,
  userPatch,
  userDelete,
}
