const {
  clearStoredSession,
  getStoredSession,
} = require('../../utils/auth')
const { ensureCurrentBabyContext } = require('../../utils/babyContext')
const { userGet } = require('../../utils/supabaseRest')
const { relativeTimeShort, documentToLogItem, titleForCat } = require('../../utils/recordUi')

const TYPE_LABELS = {
  feeding: '喂养',
  sleep: '睡眠',
  mood: '情绪',
  diaper: '尿布',
  growth: '成长',
  note: '记录',
  general: '记录',
}

const WEEK_DAYS = ['一', '二', '三', '四', '五', '六', '日']

function startOfWeekMonday(d) {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(date)
  mon.setDate(date.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

function buildPast24FromDocs(docs) {
  const list = []
  const seen = new Set()
  for (const doc of docs) {
    const rt = doc.record_type || 'note'
    if (seen.has(rt)) continue
    seen.add(rt)
    const m = documentToLogItem(doc, titleForCat(rt))
    const mainRaw = (doc.body || doc.title || '—').toString().trim()
    const main =
      mainRaw.length > 28 ? `${mainRaw.slice(0, 28)}…` : mainRaw
    list.push({
      icon: m.icon,
      time: relativeTimeShort(doc.recorded_at),
      label: TYPE_LABELS[rt] || '记录',
      main,
      sub: '近 24 小时',
    })
    if (list.length >= 4) break
  }
  while (list.length < 4) {
    list.push({
      icon: '·',
      time: '—',
      label: '暂无',
      main: '—',
      sub: '去录入补充',
    })
  }
  return list.slice(0, 4)
}

function buildSleepWeek(sleepDocs) {
  const monday = startOfWeekMonday(new Date())
  const counts = new Array(7).fill(0)
  for (const doc of sleepDocs) {
    const t = new Date(doc.recorded_at)
    const idx = Math.floor((t - monday) / (24 * 60 * 60 * 1000))
    if (idx >= 0 && idx < 7) counts[idx] += 1
  }
  const max = Math.max(1, ...counts)
  const todayIdx = Math.floor((Date.now() - monday) / (24 * 60 * 60 * 1000))
  const clampedToday = Math.min(6, Math.max(0, todayIdx))

  return WEEK_DAYS.map((d, i) => {
    const c = counts[i]
    const h = Math.min(95, 22 + Math.round((c / max) * 73))
    return {
      d,
      h,
      on: i === clampedToday,
      badge: c ? `${c}条` : '',
    }
  })
}

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    user: null,
    dateLine: '',
    loading: true,
    loadError: '',
    past24: [],
    sleepWeek: [],
  },

  onShow() {
    this.syncTheme()
    this.bootstrap()
  },

  async bootstrap() {
    const session = getStoredSession()
    if (!session) {
      wx.redirectTo({
        url: '/pages/login/login',
      })
      return
    }

    this.setData({
      user: session.user,
      loading: true,
      loadError: '',
    })

    try {
      const { babies, currentBabyId } = await ensureCurrentBabyContext(
        wx,
        session.accessToken
      )
      if (!babies.length) {
        wx.redirectTo({ url: '/pages/baby-setup/baby-setup' })
        return
      }

      const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [docs24, sleep7] = await Promise.all([
        userGet(
          wx,
          session.accessToken,
          `documents?baby_id=eq.${currentBabyId}&recorded_at=gte.${since24}&select=id,title,body,record_type,recorded_at,status&order=recorded_at.desc&limit=80`
        ),
        userGet(
          wx,
          session.accessToken,
          `documents?baby_id=eq.${currentBabyId}&record_type=eq.sleep&recorded_at=gte.${since7}&select=recorded_at&limit=200`
        ),
      ])

      const docList = Array.isArray(docs24) ? docs24 : []
      const sleepList = Array.isArray(sleep7) ? sleep7 : []

      const now = new Date()
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const dateLine = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${weekdays[now.getDay()]}`

      this.setData({
        loading: false,
        dateLine,
        past24: buildPast24FromDocs(docList),
        sleepWeek: buildSleepWeek(sleepList),
      })
    } catch (err) {
      const msg =
        err && err.message ? err.message : '加载失败'
      if (err && err.statusCode === 401) {
        clearStoredSession()
        wx.showToast({ title: '登录已过期', icon: 'none' })
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
      this.setData({
        loading: false,
        loadError: msg,
        past24: buildPast24FromDocs([]),
        sleepWeek: buildSleepWeek([]),
      })
      wx.showToast({ title: msg, icon: 'none' })
    }
  },

  onTapProfile() {
    wx.navigateTo({ url: '/pages/profile/profile' })
  },

  onTapBabySetup() {
    wx.navigateTo({ url: '/pages/baby-setup/baby-setup' })
  },

  onTapGoRecord() {
    wx.switchTab({ url: '/pages/record/record' })
  },

  onTapGoAsk() {
    wx.switchTab({ url: '/pages/ask/ask' })
  },

  onTapGoGrowth() {
    wx.switchTab({ url: '/pages/growth/growth' })
  },

  onTapLogout() {
    clearStoredSession()

    const app = getApp()
    app.globalData.session = null
    app.globalData.user = null
    app.globalData.currentBabyId = null

    wx.reLaunch({
      url: '/pages/login/login',
    })
  },
})
