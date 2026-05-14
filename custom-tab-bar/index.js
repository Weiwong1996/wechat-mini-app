const themeUtil = require('../utils/theme')

const TAB_ROUTES = [
  'pages/index/index',
  'pages/record/record',
  'pages/ask/ask',
  'pages/growth/growth',
]

Component({
  data: {
    hidden: true,
    selected: 0,
    isDark: false,
    list: [
      { pagePath: '/pages/index/index', text: '工作台', icon: '📊' },
      { pagePath: '/pages/record/record', text: '记录', icon: '📝' },
      { pagePath: '/pages/ask/ask', text: '问答', icon: '💬' },
      { pagePath: '/pages/growth/growth', text: '成长', icon: '📈' },
    ],
  },

  pageLifetimes: {
    show() {
      this.syncAll()
    },
  },

  lifetimes: {
    attached() {
      const app = getApp()
      app.globalData.tabBarInstance = this
      this.syncAll()
    },
    detached() {
      const app = getApp()
      if (app.globalData.tabBarInstance === this) {
        app.globalData.tabBarInstance = null
      }
    },
  },

  methods: {
    syncAll() {
      this.syncVisibility()
      this.syncSelected()
      this.syncThemeOnly()
    },

    syncVisibility() {
      const pages = getCurrentPages()
      const route = pages.length ? pages[pages.length - 1].route : ''
      const show = TAB_ROUTES.includes(route)
      this.setData({ hidden: !show })
    },

    syncSelected() {
      const pages = getCurrentPages()
      const route = pages.length ? pages[pages.length - 1].route : ''
      const idx = TAB_ROUTES.indexOf(route)
      if (idx >= 0) {
        this.setData({ selected: idx })
      }
    },

    syncThemeOnly() {
      this.setData({
        isDark: themeUtil.isDarkEffective(),
      })
    },

    onTapTab(e) {
      const idx = Number(e.currentTarget.dataset.index)
      if (Number.isNaN(idx)) return
      const path = this.data.list[idx].pagePath
      wx.switchTab({ url: path })
    },
  },
})
