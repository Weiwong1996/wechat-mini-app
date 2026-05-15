const themeUtil = require('../../utils/theme')
const {
  clearStoredSession,
  getCurrentBabyId,
  getStoredSession,
  setCurrentBabyId,
} = require('../../utils/auth')
const { ensureCurrentBabyContext } = require('../../utils/babyContext')
const { userGet, userPatch, userPost } = require('../../utils/supabaseRest')

function formatAgeSubtitle(birthAt) {
  if (!birthAt) return '出生信息未填'
  const b = new Date(birthAt)
  if (Number.isNaN(b.getTime())) return '出生信息未填'
  const now = new Date()
  let months =
    (now.getFullYear() - b.getFullYear()) * 12 +
    (now.getMonth() - b.getMonth())
  if (now.getDate() < b.getDate()) months -= 1
  if (months < 0) months = 0
  const years = Math.floor(months / 12)
  const mo = months % 12
  if (years <= 0) return `${mo} 个月 · 成长阶段`
  return `${years} 岁 ${mo} 个月 · 成长阶段`
}

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    themePref: 'system',
    babyName: '',
    babySubtitle: '',
    avatarLetter: '宝',
    tags: [],
    profiles: [],
    aiMilestone: true,
    contextualMemory: true,
    loading: true,
    currentBabyId: '',
    _babies: [],
  },

  onShow() {
    this.loadProfile()
  },

  async loadProfile() {
    const session = getStoredSession()
    if (!session) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true })

    try {
      const { babies, currentBabyId } = await ensureCurrentBabyContext(
        wx,
        session.accessToken
      )

    try {
      await this.syncThemeFromServer(session)
    } catch (e) {
      /* 偏好同步失败不阻塞档案展示 */
    }

      const cid = currentBabyId || getCurrentBabyId()
      const active = babies.find((b) => b.id === cid) || babies[0]
      const prefs = active && active.prefs ? active.prefs : {}

      const profiles = babies.map((b) => ({
        id: b.id,
        name: b.name,
        initial: b.name ? String(b.name).charAt(0).toUpperCase() : '宝',
        active: b.id === cid,
      }))

      this.setData({
        loading: false,
        _babies: babies,
        profiles,
        currentBabyId: cid || '',
        babyName: active ? active.name : '未设置',
        babySubtitle: active ? formatAgeSubtitle(active.birth_at) : '',
        avatarLetter: active && active.name ? active.name.charAt(0) : '宝',
        tags:
          active && active.gender === 'boy'
            ? ['男孩', '成长档案']
            : active && active.gender === 'girl'
              ? ['女孩', '成长档案']
              : ['成长档案'],
        aiMilestone: prefs.ai_tracking !== false,
        contextualMemory: prefs.partner_sharing !== false,
        themePref: themeUtil.getPreference(),
      })
      this.syncTheme()
    } catch (err) {
      if (err && err.statusCode === 401) {
        clearStoredSession()
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  async syncThemeFromServer(session) {
    const rows = await userGet(
      wx,
      session.accessToken,
      'user_preferences?select=theme,updated_at'
    )
    const list = Array.isArray(rows) ? rows : []
    if (!list.length) return
    const row = list[0]
    if (row.theme === 'light' || row.theme === 'dark' || row.theme === 'system') {
      themeUtil.setPreference(row.theme)
    }
  },

  async persistTheme(theme) {
    const session = getStoredSession()
    if (!session || !session.user || !session.user.id) return

    const userId = session.user.id
    const rows = await userGet(
      wx,
      session.accessToken,
      'user_preferences?select=user_id&limit=1'
    )
    const existing = Array.isArray(rows) && rows.length

    if (!existing) {
      await userPost(wx, session.accessToken, 'user_preferences', {
        user_id: userId,
        theme,
      })
    } else {
      await userPatch(wx, session.accessToken, `user_preferences?user_id=eq.${userId}`, {
        theme,
        updated_at: new Date().toISOString(),
      })
    }
  },

  onSelectTheme(e) {
    const value = e.currentTarget.dataset.value
    if (!value) return
    themeUtil.setPreference(value)
    this.setData({ themePref: value })
    this.syncTheme()
    wx.showToast({ title: '已保存外观', icon: 'success' })
    this.persistTheme(value).catch(() => {
      wx.showToast({ title: '同步主题到云端失败', icon: 'none' })
    })
  },

  onPickProfile(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    setCurrentBabyId(id, wx)
    const profiles = this.data.profiles.map((p) => ({
      ...p,
      active: p.id === id,
    }))
    const active = this.data._babies.find((b) => b.id === id)
    const prefs = active && active.prefs ? active.prefs : {}
    this.setData({
      profiles,
      currentBabyId: id,
      babyName: active ? active.name : '',
      babySubtitle: active ? formatAgeSubtitle(active.birth_at) : '',
      avatarLetter: active && active.name ? active.name.charAt(0) : '宝',
      aiMilestone: prefs.ai_tracking !== false,
      contextualMemory: prefs.partner_sharing !== false,
    })
  },

  onTapAddProfile() {
    wx.navigateTo({ url: '/pages/baby-setup/baby-setup' })
  },

  onTapAvatar() {
    wx.showToast({ title: '头像功能开发中', icon: 'none' })
  },

  onTapRow() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  async onToggleAiMilestone(e) {
    const v = e && e.detail ? e.detail.value : null
    const next =
      typeof v === 'boolean' ? v : !this.data.aiMilestone
    this.setData({ aiMilestone: next })
    await this.patchCurrentBabyPrefs({ ai_tracking: next })
  },

  async onToggleMemory(e) {
    const v = e && e.detail ? e.detail.value : null
    const next =
      typeof v === 'boolean' ? v : !this.data.contextualMemory
    this.setData({ contextualMemory: next })
    await this.patchCurrentBabyPrefs({ partner_sharing: next })
  },

  async patchCurrentBabyPrefs(partial) {
    const session = getStoredSession()
    const babyId = getCurrentBabyId()
    if (!session || !babyId) return

    const active = this.data._babies.find((b) => b.id === babyId)
    const base =
      active && active.prefs && typeof active.prefs === 'object' ? active.prefs : {}
    const prefs = { ...base, ...partial }

    try {
      await userPatch(wx, session.accessToken, `babies?id=eq.${babyId}`, {
        prefs,
      })
      const babies = this.data._babies.map((b) =>
        b.id === babyId ? { ...b, prefs } : b
      )
      this.setData({ _babies: babies })
    } catch (err) {
      if (err && err.statusCode === 401) {
        clearStoredSession()
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
      wx.showToast({ title: err.message || '同步失败', icon: 'none' })
    }
  },

  onTapBabySetup() {
    wx.navigateTo({ url: '/pages/baby-setup/baby-setup' })
  },

  onTapBack() {
    wx.navigateBack()
  },

  onTapSignOut() {
    wx.showModal({
      title: '退出登录',
      content: '确定清除本地会话并返回登录页？',
      success: (res) => {
        if (!res.confirm) return
        clearStoredSession()
        const app = getApp()
        if (app && app.globalData) {
          app.globalData.session = null
          app.globalData.user = null
          app.globalData.currentBabyId = null
        }
        wx.reLaunch({ url: '/pages/login/login' })
      },
    })
  },
})
