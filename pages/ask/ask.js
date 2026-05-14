Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    question: '',
    answer:
      '很多宝宝在 4 个月左右会出现「睡眠倒退」，常与昼夜节律调整有关。可以把重点放在稳定入睡程序与环境上（以下为演示要点）。',
    tips: [
      '保持固定的睡前顺序（洗、讲、睡）',
      '卧室尽量偏暗、温度舒适',
      '尝试「困顿但未完全睡着」时放床，练习自我安抚',
      '白天留意清醒间隔，避免过度疲劳',
    ],
    quickPills: [
      { key: 'sleep', icon: '🌙', label: '睡眠记录' },
      { key: 'feed', icon: '🍼', label: '喂养建议' },
      { key: 'growth', icon: '📏', label: '生长曲线' },
      { key: 'plan', icon: '📅', label: '作息安排' },
    ],
  },

  onShow() {
    this.syncTheme()
  },

  onInputQuestion(e) {
    this.setData({ question: e.detail.value })
  },

  onTapSend() {
    const q = this.data.question.trim()
    if (!q) {
      wx.showToast({ title: '请先输入问题', icon: 'none' })
      return
    }
    this.setData({
      answer: `（演示）关于「${q}」：可先观察 3～5 天作息与醒来后安抚方式，必要时咨询儿科或睡眠顾问。以下为通用参考要点。`,
      tips: [
        '记录入睡、醒来的时间点，找规律',
        '避免过度疲劳：按需拉长或缩短清醒间隔做试探',
        '夜醒后尽量保持低刺激、短安抚',
        '白天充足日照与活动，夜晚保持昏暗安静',
      ],
    })
    wx.showToast({ title: '已更新回复', icon: 'success' })
  },

  onTapMic() {
    wx.showToast({ title: '语音输入为演示占位', icon: 'none' })
  },

  onTapQuickPill(e) {
    const key = e.currentTarget.dataset.key
    const map = {
      sleep: '最近夜醒变多，和睡眠倒退有关吗？',
      feed: '喂奶间隔要不要固定下来？',
      growth: '身高体重在同龄里大概什么水平？',
      plan: '6 个月前后作息大概怎么安排？',
    }
    const preset = map[key]
    if (preset) {
      this.setData({ question: preset })
      wx.showToast({ title: '已填入示例问题', icon: 'none' })
    }
  },
})
