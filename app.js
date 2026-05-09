const { getStoredSession } = require('./utils/auth')

App({
  globalData: {
    session: null,
    user: null
  },

  onLaunch() {
    const session = getStoredSession()

    if (session) {
      this.globalData.session = session
      this.globalData.user = session.user || null
    }
  }
})
