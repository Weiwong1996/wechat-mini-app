Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    search: '',
    filter: 'all',
    showComposer: false,
    body: '',
    todayFiltered: [],
    yesterdayFiltered: [],
    todayLogs: [
      {
        id: 't1',
        cat: 'feeding',
        icon: '🍼',
        title: '午间喂养',
        timeLine: '12:30 · 配方奶 150 ml',
        status: 'indexed',
        statusDot: 'green',
        body: '胃口不错，很快安静入睡。',
      },
      {
        id: 't2',
        cat: 'sleep',
        icon: '🌙',
        title: '晨间小睡',
        timeLine: '09:15 · 1 小时 20 分',
        status: 'indexing',
        statusDot: 'amber',
        body: '',
      },
    ],
    yesterdayLogs: [
      {
        id: 'y1',
        cat: 'growth',
        icon: '📏',
        title: '生长测量',
        timeLine: '16:45 · 体重与身长',
        status: 'indexed',
        statusDot: 'green',
        extraGrid: [
          { k: '体重', v: '6.4 kg' },
          { k: '身长', v: '62 cm' },
        ],
      },
      {
        id: 'y2',
        cat: 'growth',
        icon: '✨',
        title: '里程碑：第一次微笑',
        timeLine: '10:10 · 情绪发展',
        status: 'indexed',
        statusDot: 'green',
        body: '',
        hasPhoto: true,
      },
    ],
  },

  onShow() {
    this.syncTheme()
    this.applyFilter()
  },

  applyFilter() {
    const { search, filter, todayLogs, yesterdayLogs } = this.data
    const match = (log) => {
      if (filter !== 'all' && log.cat !== filter) {
        return false
      }
      const q = (search || '').trim().toLowerCase()
      if (!q) return true
      const hay = `${log.title} ${log.timeLine} ${log.body || ''}`.toLowerCase()
      return hay.includes(q)
    }
    this.setData({
      todayFiltered: todayLogs.filter(match),
      yesterdayFiltered: yesterdayLogs.filter(match),
    })
  },

  onInputSearch(e) {
    this.setData({ search: e.detail.value })
    this.applyFilter()
  },

  onFilter(e) {
    const f = e.currentTarget.dataset.f
    if (f) {
      this.setData({ filter: f })
      this.applyFilter()
    }
  },

  onTapFab() {
    this.setData({ showComposer: true, body: '' })
  },

  onCloseComposer() {
    this.setData({ showComposer: false })
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
    this.setData({ body: '', showComposer: false })
  },

  noop() {},
})
