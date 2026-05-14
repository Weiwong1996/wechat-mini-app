const theme = require('../utils/theme')

module.exports = Behavior({
  data: {
    isDark: false,
  },

  pageLifetimes: {
    show() {
      this.syncTheme()
    },
  },

  methods: {
    syncTheme() {
      theme.syncPageRootTheme(this)
    },
  },
})
