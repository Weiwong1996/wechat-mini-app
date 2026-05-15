const {
  clearStoredSession,
  getStoredSession,
} = require('../../utils/auth')
const { ensureCurrentBabyContext } = require('../../utils/babyContext')
const { userGet, userPost } = require('../../utils/supabaseRest')
const {
  documentToLogItem,
  titleForCat,
  dayBucket,
} = require('../../utils/recordUi')

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    search: '',
    filter: 'all',
    showComposer: false,
    body: '',
    todayFiltered: [],
    yesterdayFiltered: [],
    todayLogs: [],
    yesterdayLogs: [],
    loading: true,
    needBabySetup: false,
  },

  onShow() {
    this.syncTheme()
    this.loadDocuments()
  },

  async loadDocuments() {
    const session = getStoredSession()
    if (!session) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true, needBabySetup: false })

    try {
      const { babies, currentBabyId } = await ensureCurrentBabyContext(
        wx,
        session.accessToken
      )
      if (!babies.length || !currentBabyId) {
        this.setData({
          loading: false,
          needBabySetup: true,
          todayLogs: [],
          yesterdayLogs: [],
        })
        this.applyFilter()
        return
      }

      const docs = await userGet(
        wx,
        session.accessToken,
        `documents?baby_id=eq.${currentBabyId}&select=id,title,body,record_type,status,recorded_at&order=recorded_at.desc&limit=120`
      )
      const rows = Array.isArray(docs) ? docs : []

      const todayLogs = []
      const yesterdayLogs = []

      for (const doc of rows) {
        const item = documentToLogItem(doc, titleForCat(doc.record_type || 'note'))
        const bucket = dayBucket(doc.recorded_at)
        if (bucket === 'today') todayLogs.push(item)
        else if (bucket === 'yesterday') yesterdayLogs.push(item)
      }

      this.setData({
        loading: false,
        todayLogs,
        yesterdayLogs,
      })
      this.applyFilter()
    } catch (err) {
      if (err && err.statusCode === 401) {
        clearStoredSession()
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
      this.setData({ loading: false })
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
      })
    }
  },

  applyFilter() {
    const { search, filter, todayLogs, yesterdayLogs } = this.data
    const match = (log) => {
      if (filter !== 'all' && log.cat !== filter) {
        return false
      }
      const q = (search || '').trim().toLowerCase()
      if (!q) return true
      const hay = `${log.title} ${log.timeLine} ${log.body || ''}`.toLowerCase()
      return hay.includes(q)
    }
    this.setData({
      todayFiltered: todayLogs.filter(match),
      yesterdayFiltered: yesterdayLogs.filter(match),
    })
  },

  onInputSearch(e) {
    this.setData({ search: e.detail.value })
    this.applyFilter()
  },

  onFilter(e) {
    const f = e.currentTarget.dataset.f
    if (f) {
      this.setData({ filter: f })
      this.applyFilter()
    }
  },

  onTapFab() {
    this.setData({ showComposer: true, body: '' })
  },

  onCloseComposer() {
    this.setData({ showComposer: false })
  },

  onInputBody(e) {
    this.setData({ body: e.detail.value })
  },

  async onTapSubmit() {
    const body = (this.data.body || '').trim()
    if (!body) {
      wx.showToast({ title: '请先输入内容', icon: 'none' })
      return
    }

    const session = getStoredSession()
    if (!session || !session.user || !session.user.id) {
      wx.showToast({ title: '未登录', icon: 'none' })
      return
    }

    const { currentBabyId } = await ensureCurrentBabyContext(
      wx,
      session.accessToken
    )
    if (!currentBabyId) {
      wx.showToast({ title: '请先创建宝宝档案', icon: 'none' })
      return
    }

    const recordType =
      this.data.filter !== 'all' ? this.data.filter : 'note'
    const title =
      body.length > 18 ? `${body.slice(0, 18)}…` : body

    try {
      await userPost(wx, session.accessToken, 'documents', {
        user_id: session.user.id,
        baby_id: currentBabyId,
        title,
        body,
        record_type: recordType,
        status: 'indexed',
      })
      wx.showToast({ title: '已保存', icon: 'success' })
      this.setData({ body: '', showComposer: false })
      await this.loadDocuments()
    } catch (err) {
      if (err && err.statusCode === 401) {
        clearStoredSession()
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
      wx.showToast({
        title: err.message || '保存失败',
        icon: 'none',
      })
    }
  },

  onTapGoBabySetup() {
    wx.navigateTo({ url: '/pages/baby-setup/baby-setup' })
  },

  noop() {},
})
