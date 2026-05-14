Page({
  data: {
    question: '',
    answer: '回答将显示在这里（静态占位）',
    citations: ['引用片段一：示例记录摘要…', '引用片段二：示例记录摘要…']
  },

  onInputQuestion(e) {
    this.setData({ question: e.detail.value })
  },

  onTapSend() {
    const q = this.data.question.trim()
    if (!q) {
      wx.showToast({ title: '请输入问题', icon: 'none' })
      return
    }
    this.setData({
      answer: '这是针对「' + q + '」的示例回答（未调用后端，仅静态演示）。',
      citations: ['引用 1：与问题相关的记录片段占位', '引用 2：相关上下文占位']
    })
    wx.showToast({ title: '已更新占位内容', icon: 'none' })
  }
})
