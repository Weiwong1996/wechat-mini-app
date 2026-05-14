const themeUtil = require('../../utils/theme')

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    themePref: 'system',
    babyName: 'Leo',
    babySubtitle: '2 岁 4 个月 · 成长阶段 3',
    tags: ['主动探索', '生长突增期'],
    profiles: [
      { id: '1', name: 'Leo', initial: 'L', active: true },
      { id: '2', name: 'Maya', initial: 'M', active: false },
    ],
    aiMilestone: true,
    contextualMemory: true,
  },

  onShow() {
    this.setData({
      themePref: themeUtil.getPreference(),
    })
    this.syncTheme()
  },

  onSelectTheme(e) {
    const value = e.currentTarget.dataset.value
    if (!value) return
    themeUtil.setPreference(value)
    this.setData({ themePref: value })
    this.syncTheme()
    wx.showToast({ title: '已保存外观', icon: 'success' })
  },

  onPickProfile(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const profiles = this.data.profiles.map((p) => ({
      id: p.id,
      name: p.name,
      initial: p.initial,
      active: p.id === id,
    }))
    this.setData({ profiles })
  },

  onTapAddProfile() {
    wx.showToast({ title: '演示：新建档案', icon: 'none' })
  },

  onTapAvatar() {
    wx.showToast({ title: '演示：更换头像', icon: 'none' })
  },

  onTapRow() {
    wx.showToast({ title: '演示：功能开发中', icon: 'none' })
  },

  onToggleAiMilestone(e) {
    const v = e && e.detail ? e.detail.value : null
    if (typeof v === 'boolean') {
      this.setData({ aiMilestone: v })
    } else {
      this.setData({ aiMilestone: !this.data.aiMilestone })
    }
  },

  onToggleMemory(e) {
    const v = e && e.detail ? e.detail.value : null
    if (typeof v === 'boolean') {
      this.setData({ contextualMemory: v })
    } else {
      this.setData({ contextualMemory: !this.data.contextualMemory })
    }
  },

  onTapBabySetup() {
    wx.navigateTo({ url: '/pages/baby-setup/baby-setup' })
  },

  onTapBack() {
    wx.navigateBack()
  },

  onTapSignOut() {
    wx.showModal({
      title: '退出登录',
      content: '演示环境不会清除真实会话。',
      confirmText: '知道了',
      showCancel: false,
    })
  },
})
