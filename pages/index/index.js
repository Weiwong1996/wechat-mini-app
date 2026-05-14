const { clearStoredSession, getStoredSession } = require('../../utils/auth')

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    user: null,
    dateLine: '',
    past24: [
      { icon: '🍼', time: '2 小时前', label: '喂养', main: '180 ml', sub: '今日累计约 720 ml' },
      { icon: '🌙', time: '45 分钟前', label: '睡眠', main: '11.2 小时', sub: '连续片段更稳' },
      { icon: '😊', time: '当前', label: '情绪', main: '安定', sub: '已稳定 3 小时' },
      { icon: '🧷', time: '1 小时前', label: '尿布', main: '6 次', sub: '上次 09:15' },
    ],
    sleepWeek: [
      { d: '一', h: 38, on: false },
      { d: '二', h: 52, on: false },
      { d: '三', h: 88, on: true, badge: '12.8h' },
      { d: '四', h: 34, on: false },
      { d: '五', h: 62, on: false },
      { d: '六', h: 58, on: false },
      { d: '日', h: 55, on: false },
    ],
  },

  onShow() {
    this.syncTheme()
    const session = getStoredSession()

    if (!session) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    const now = new Date()
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const dateLine = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${weekdays[now.getDay()]}`

    this.setData({
      user: session.user,
      dateLine,
    })
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

    wx.reLaunch({
      url: '/pages/login/login'
    })
  },
})
