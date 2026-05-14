Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    step: 1,
    babyName: 'Leo James',
    gender: 'boy',
    birthDate: '2024-03-14',
    birthTime: '08:30',
    weightLb: '7',
    weightOz: '4',
    lengthIn: '20.5',
    aiTracking: true,
    partnerSharing: true,
  },

  onShow() {
    this.syncTheme()
  },

  onInputName(e) {
    this.setData({ babyName: e.detail.value })
  },

  onPickGender(e) {
    const g = e.currentTarget.dataset.g
    if (g) this.setData({ gender: g })
  },

  onPickDate(e) {
    this.setData({ birthDate: e.detail.value })
  },

  onPickTime(e) {
    this.setData({ birthTime: e.detail.value })
  },

  onInputWeightLb(e) {
    this.setData({ weightLb: e.detail.value })
  },

  onInputWeightOz(e) {
    this.setData({ weightOz: e.detail.value })
  },

  onInputLength(e) {
    this.setData({ lengthIn: e.detail.value })
  },

  onToggleAi(e) {
    this.setData({ aiTracking: e.detail.value })
  },

  onTogglePartner(e) {
    this.setData({ partnerSharing: e.detail.value })
  },

  onTapPhoto() {
    wx.showToast({ title: '演示：上传照片', icon: 'none' })
  },

  onTapNext() {
    if (this.data.step >= 3) return
    this.setData({ step: this.data.step + 1 })
  },

  onTapBackStep() {
    if (this.data.step <= 1) {
      wx.navigateBack()
    } else {
      this.setData({ step: this.data.step - 1 })
    }
  },

  onTapDone() {
    wx.showToast({ title: '已保存（演示）', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 900)
  },
})
