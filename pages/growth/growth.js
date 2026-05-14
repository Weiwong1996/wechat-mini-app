Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    metricKind: 'weight',
    yAxisKg: ['9kg', '7kg', '5kg', '3kg', '1kg'],
    xAxis: ['出生', '1m', '2m', '3m', '4m', '5m', '6m'],
    bento: [
      {
        key: 'w',
        label: '当前体重',
        main: '7.2',
        unit: 'kg',
        delta: '+0.4 kg 较上月',
        up: true,
      },
      {
        key: 'p',
        label: '百分位',
        main: '68th',
        unit: '',
        sub: '稳定增长轨迹',
      },
      {
        key: 'g',
        label: '月增重',
        main: '480',
        unit: 'g',
        sub: '处于预期区间',
      },
    ],
    insight:
      "宝宝的生长轨迹令人安心：最近数月大致维持在约 68 百分位，发育平稳可预期。近期增重 480g 对该月龄来说非常合适。建议继续沿用目前的喂养节奏；代谢与营养利用良好（演示文案）。",
    recentLogs: [
      { icon: '⚖️', title: '月度体检', time: '今天 09:30', val: '7.2 kg' },
      { icon: '📏', title: '身高测量', time: '9 月 10 日 14:15', val: '66.5 cm' },
      { icon: '⚖️', title: '居家称重', time: '8 月 28 日 08:45', val: '6.8 kg' },
    ],
  },

  onShow() {
    this.syncTheme()
    setTimeout(() => this.drawGrowthChart(), 80)
  },

  onReady() {
    this._chartReady = true
    this.drawGrowthChart()
  },

  onPickMetric(e) {
    const k = e.currentTarget.dataset.k
    if (!k || k === this.data.metricKind) return
    const yAxisKg =
      k === 'weight'
        ? ['9kg', '7kg', '5kg', '3kg', '1kg']
        : k === 'height'
          ? ['70cm', '65cm', '60cm', '55cm', '50cm']
          : ['42cm', '40cm', '38cm', '36cm', '34cm']
    this.setData({ metricKind: k, yAxisKg }, () => this.drawGrowthChart())
  },

  drawGrowthChart() {
    if (!this._chartReady) return
    wx.createSelectorQuery()
      .in(this)
      .select('#growthCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const first = res[0]
        if (!first || !first.node) return
        const canvas = first.node
        const ctx = canvas.getContext('2d')
        const cssW = first.width
        const cssH = first.height
        if (!cssW || !cssH) return
        const dpr = wx.getSystemInfoSync().pixelRatio || 2
        canvas.width = cssW * dpr
        canvas.height = cssH * dpr
        ctx.scale(dpr, dpr)
        const dark = this.data.isDark
        ctx.clearRect(0, 0, cssW, cssH)

        const w = cssW
        const h = cssH
        const bandW = Math.max(14, w * 0.034)

        // WHO 区间带（粗描边模拟 HTML 中的宽描边路径）
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.strokeStyle = dark ? 'rgba(180, 178, 172, 0.35)' : '#ECEAE4'
        ctx.lineWidth = bandW
        ctx.beginPath()
        ctx.moveTo(0, h * 0.82)
        ctx.bezierCurveTo(w * 0.25, h * 0.62, w * 0.52, h * 0.42, w, h * 0.18)
        ctx.stroke()

        // WHO 中位线（虚线）
        ctx.setLineDash([6, 4])
        ctx.strokeStyle = dark ? 'rgba(210, 208, 200, 0.55)' : 'rgba(95, 95, 93, 0.55)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(0, h * 0.85)
        ctx.bezierCurveTo(w * 0.28, h * 0.62, w * 0.58, h * 0.42, w, h * 0.2)
        ctx.stroke()
        ctx.setLineDash([])

        // 宝宝生长折线
        ctx.strokeStyle = dark ? '#f0eeeb' : '#1C1C1C'
        ctx.lineWidth = 3
        ctx.beginPath()
        const pts = [
          [0, 0.9],
          [0.1667, 0.74],
          [0.3333, 0.63],
          [0.5, 0.56],
          [0.6667, 0.48],
          [0.8333, 0.42],
          [1, 0.35],
        ]
        ctx.moveTo(pts[0][0] * w, pts[0][1] * h)
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0] * w, pts[i][1] * h)
        }
        ctx.stroke()

        // 数据点
        ctx.fillStyle = dark ? '#f0eeeb' : '#1C1C1C'
        pts.forEach((p, i) => {
          const r = i === pts.length - 1 ? 6 : 4.5
          ctx.beginPath()
          ctx.arc(p[0] * w, p[1] * h, r, 0, Math.PI * 2)
          ctx.fill()
        })
        if (!dark) {
          const p = pts[pts.length - 1]
          ctx.beginPath()
          ctx.arc(p[0] * w, p[1] * h, 6, 0, Math.PI * 2)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
  },

  onTapDownload() {
    wx.showToast({ title: '演示：导出报告', icon: 'none' })
  },

  onTapClinic() {
    wx.showToast({ title: '演示：联系诊所', icon: 'none' })
  },

  onTapViewAllLogs() {
    wx.switchTab({ url: '/pages/record/record' })
  },
})
