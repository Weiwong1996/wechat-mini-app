const { clearStoredSession, getStoredSession } = require('../../utils/auth')

Page({
  data: {
    user: null,
    hasSession: false
  },

  onShow() {
    const session = getStoredSession()

    if (!session) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
      return
    }

    this.setData({
      user: session.user,
      hasSession: true
    })
  },

  onTapLogout() {
    clearStoredSession()

    const app = getApp()
    app.globalData.session = null
    app.globalData.user = null

    wx.reLaunch({
      url: '/pages/login/login'
    })
  }
})
