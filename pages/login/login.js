const { getStoredSession, loginWithWeChat } = require('../../utils/auth')

Page({
  data: {
    isLoggingIn: false,
    errorMessage: ''
  },

  onShow() {
    const session = getStoredSession()

    if (session) {
      wx.redirectTo({
        url: '/pages/index/index'
      })
    }
  },

  async onTapLogin() {
    if (this.data.isLoggingIn) return

    this.setData({
      isLoggingIn: true,
      errorMessage: ''
    })

    try {
      const session = await loginWithWeChat()
      const app = getApp()

      app.globalData.session = session
      app.globalData.user = session.user

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      wx.redirectTo({
        url: '/pages/index/index'
      })
    } catch (error) {
      const message = error && error.message ? error.message : '登录失败'

      this.setData({
        errorMessage: message
      })

      wx.showToast({
        title: message,
        icon: 'none'
      })

      console.error('微信登录失败:', error)
    } finally {
      this.setData({
        isLoggingIn: false
      })
    }
  }
})
