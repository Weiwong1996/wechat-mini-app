const { getStoredSession, getCurrentBabyId } = require('./utils/auth')
const theme = require('./utils/theme')

App({
  globalData: {
    session: null,
    user: null,
    currentBabyId: null,
    tabBarInstance: null,
  },

  onLaunch() {
    const session = getStoredSession()

    if (session) {
      this.globalData.session = session
      this.globalData.user = session.user || null
    }

    this.globalData.currentBabyId = getCurrentBabyId()

    if (typeof wx.onThemeChange === 'function') {
      wx.onThemeChange(() => {
        if (theme.getPreference() !== 'system') return
        theme.syncTabBar()
        const pages = getCurrentPages()
        const cur = pages[pages.length - 1]
        if (cur && typeof cur.syncTheme === 'function') {
          cur.syncTheme()
        }
      })
    }
  },

  onShow() {
    /* 从子页返回 Tab 或冷启动后 tabBar 实例就绪，补一次主题同步 */
    theme.syncTabBar()
  },
})
