/** Theme preference + navigation bar; pairs with behaviors/theme.js and .page-root.theme-dark */
const PREF_KEY = 'app_theme_preference'

/** @returns {'system'|'light'|'dark'} */
function getPreference() {
  try {
    const v = wx.getStorageSync(PREF_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
    return 'system'
  } catch {
    return 'system'
  }
}

/** @param {'system'|'light'|'dark'} value */
function setPreference(value) {
  wx.setStorageSync(PREF_KEY, value)
}

function getSystemTheme() {
  try {
    const info = wx.getSystemInfoSync()
    return info.theme === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

/** Resolved appearance for UI */
function resolveEffectiveTheme() {
  const pref = getPreference()
  if (pref === 'light' || pref === 'dark') return pref
  return getSystemTheme()
}

function isDarkEffective() {
  return resolveEffectiveTheme() === 'dark'
}

const NAV = {
  light: { frontColor: '#000000', backgroundColor: '#f7f4ed' },
  dark: { frontColor: '#ffffff', backgroundColor: '#2c2b2b' },
}

function applyNavigationBarForTheme() {
  const dark = isDarkEffective()
  const c = dark ? NAV.dark : NAV.light
  wx.setNavigationBarColor({
    frontColor: c.frontColor,
    backgroundColor: c.backgroundColor,
    animation: {
      duration: 200,
      timingFunc: 'easeIn',
    },
  })
}

function syncPageRootTheme(page) {
  if (!page || typeof page.setData !== 'function') return
  page.setData({
    isDark: isDarkEffective(),
  })
  applyNavigationBarForTheme()
  syncTabBar()
}

function syncTabBar() {
  const run = () => {
    try {
      const app = getApp()
      const inst = app.globalData && app.globalData.tabBarInstance
      if (inst && typeof inst.syncAll === 'function') {
        inst.syncAll()
        return true
      }
    } catch (e) {
      /* 冷启动等时机 getApp 可能未就绪 */
    }
    return false
  }
  if (run()) return
  /* 自定义 tabBar 晚于首屏 Page.onShow 挂载时会漏一次同步 */
  setTimeout(() => {
    run()
  }, 50)
}

module.exports = {
  PREF_KEY,
  getPreference,
  setPreference,
  getSystemTheme,
  resolveEffectiveTheme,
  isDarkEffective,
  applyNavigationBarForTheme,
  syncPageRootTheme,
  syncTabBar,
}
