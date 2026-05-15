const { getCurrentBabyId, setCurrentBabyId } = require('./auth')
const { userGet } = require('./supabaseRest')

/**
 * 拉取当前用户的宝宝列表，并保证本地 current_baby_id 落在其中之一。
 * @returns {{ babies: object[], currentBabyId: string | null }}
 */
async function ensureCurrentBabyContext(wxApi, accessToken) {
  const rows = await userGet(
    wxApi,
    accessToken,
    'babies?select=*&order=created_at.asc'
  )
  const babies = Array.isArray(rows) ? rows : []
  if (!babies.length) {
    setCurrentBabyId(null, wxApi)
    return { babies, currentBabyId: null }
  }
  let id = getCurrentBabyId(wxApi)
  const valid = !!(id && babies.some((b) => b.id === id))
  if (!valid) {
    id = babies[0].id
    setCurrentBabyId(id, wxApi)
  }
  return { babies, currentBabyId: id }
}

module.exports = {
  ensureCurrentBabyContext,
}
