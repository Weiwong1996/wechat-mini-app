Page({
  data: {
    body: ''
  },

  onInputBody(e) {
    this.setData({ body: e.detail.value })
  },

  onTapSubmit() {
    if (!this.data.body.trim()) {
      wx.showToast({ title: '请先输入内容', icon: 'none' })
      return
    }
    wx.showToast({ title: '已保存（静态演示）', icon: 'success' })
    this.setData({ body: '' })
  }
})
