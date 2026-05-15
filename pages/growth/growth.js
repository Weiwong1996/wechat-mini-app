const {
  clearStoredSession,
  getStoredSession,
} = require('../../utils/auth')
const { ensureCurrentBabyContext } = require('../../utils/babyContext')
const { userGet } = require('../../utils/supabaseRest')

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`
}

function formatLogTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 ${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`
}

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    metricKind: 'weight',
    yAxisKg: ['9kg', '7kg', '5kg', '3kg', '1kg'],
    xAxis: ['出生', '1m', '2m', '3m', '4m', '5m', '6m'],
    bento: [],
    insight: '在录入页添加带生长数据的记录后，将在此汇总展示（当前为说明占位）。',
    recentLogs: [],
    loading: true,
    needBabySetup: false,
  },

  _chartPts: null,

  onShow() {
    this.syncTheme()
    this.loadGrowthData().then(() => {
      setTimeout(() => this.drawGrowthChart(), 80)
    })
  },

  onReady() {
    this._chartReady = true
    this.drawGrowthChart()
  },

  async loadGrowthData() {
    const session = getStoredSession()
    if (!session) {
      wx.redirectTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true, needBabySetup: false })

    try {
      const { babies, currentBabyId } = await ensureCurrentBabyContext(
        wx,
        session.accessToken
      )
      if (!babies.length || !currentBabyId) {
        this.setData({
          loading: false,
          needBabySetup: true,
          bento: [],
          recentLogs: [],
        })
        this._chartPts = null
        return
      }

      const raw = await userGet(
        wx,
        session.accessToken,
        `growth_records?baby_id=eq.${currentBabyId}&select=id,height_cm,weight_kg,head_cm,recorded_at,milestone,note&order=recorded_at.asc&limit=200`
      )
      const records = Array.isArray(raw) ? raw : []

      const series = this.buildSeriesForMetric(this.data.metricKind, records)
      this._chartPts = series.pts
      this.applyAxisLabels(series)

      const latest = records.length ? records[records.length - 1] : null
      const bento = this.buildBento(latest, records, this.data.metricKind)

      const recentSlice = records.slice(-5).reverse()
      const recentLogs = recentSlice.map((r) => {
        const w = r.weight_kg != null ? `${r.weight_kg} kg` : ''
        const h = r.height_cm != null ? `${r.height_cm} cm` : ''
        const head = r.head_cm != null ? `${r.head_cm} cm` : ''
        const val = w || h || head || r.milestone || '生长记录'
        return {
          icon: r.weight_kg != null ? '⚖️' : r.height_cm != null ? '📏' : '✨',
          title: r.milestone || '生长记录',
          time: formatLogTime(r.recorded_at),
          val,
        }
      })

      this.setData({
        loading: false,
        bento,
        recentLogs,
        insight:
          records.length > 0
            ? '以下为结构化生长记录汇总。完整问答与智能分析将在后续 Agent 阶段接入。'
            : '在「记录」页书写内容并保存后，可将结构化生长数据写入 growth_records（下一迭代）；当前列表来自已存在的测量记录。',
      })
    } catch (err) {
      if (err && err.statusCode === 401) {
        clearStoredSession()
        wx.reLaunch({ url: '/pages/login/login' })
        return
      }
      this.setData({ loading: false })
      wx.showToast({ title: err.message || '加载失败', icon: 'none' })
    }
  },

  buildSeriesForMetric(kind, records) {
    const pick = (r) => {
      if (kind === 'weight' && r.weight_kg != null) return r.weight_kg
      if (kind === 'height' && r.height_cm != null) return r.height_cm
      if (kind === 'head' && r.head_cm != null) return r.head_cm
      return null
    }

    const pts = []
    for (const r of records) {
      const v = pick(r)
      if (v == null) continue
      pts.push({ v: Number(v), t: r.recorded_at })
    }

    if (pts.length < 2) {
      return {
        pts: [
          [0, 0.9],
          [0.25, 0.74],
          [0.5, 0.56],
          [0.75, 0.45],
          [1, 0.35],
        ],
        unit: kind === 'weight' ? 'kg' : 'cm',
      }
    }

    const vals = pts.map((p) => p.v)
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const span = Math.max(max - min, 0.01)
    const pad = span * 0.15

    const norm = []
    for (let i = 0; i < pts.length; i++) {
      const x = pts.length === 1 ? 1 : i / (pts.length - 1)
      const yNorm = 1 - (pts[i].v - (min - pad)) / (span + 2 * pad)
      const y = Math.min(0.95, Math.max(0.08, yNorm))
      norm.push([x, y])
    }

    return { pts: norm, unit: kind === 'weight' ? 'kg' : 'cm' }
  },

  applyAxisLabels(series) {
    const kind = this.data.metricKind
    if (kind === 'weight') {
      this.setData({
        yAxisKg: ['上限', '', '', '', '下限'],
        xAxis: ['起点', '', '', '', '', '', '最近'],
      })
      return
    }
    if (kind === 'height') {
      this.setData({
        yAxisKg: ['高', '', '', '', '低'],
        xAxis: ['起点', '', '', '', '', '', '最近'],
      })
      return
    }
    this.setData({
      yAxisKg: ['大', '', '', '', '小'],
      xAxis: ['起点', '', '', '', '', '', '最近'],
    })
  },

  buildBento(latest, records, metricKind) {
    const out = []
    if (!latest) {
      out.push({
        key: 'w',
        label: '当前体重',
        main: '—',
        unit: 'kg',
        sub: '暂无数据',
      })
      out.push({
        key: 'p',
        label: '百分位',
        main: '—',
        unit: '',
        sub: '待补充测量',
      })
      out.push({
        key: 'g',
        label: '月增重',
        main: '—',
        unit: 'g',
        sub: '待补充测量',
      })
      return out
    }

    if (metricKind === 'weight' && latest.weight_kg != null) {
      out.push({
        key: 'w',
        label: '最近体重',
        main: `${latest.weight_kg}`,
        unit: 'kg',
        delta: '',
        sub: formatLogTime(latest.recorded_at),
      })
    } else if (metricKind === 'height' && latest.height_cm != null) {
      out.push({
        key: 'w',
        label: '最近身长',
        main: `${latest.height_cm}`,
        unit: 'cm',
        sub: formatLogTime(latest.recorded_at),
      })
    } else if (metricKind === 'head' && latest.head_cm != null) {
      out.push({
        key: 'w',
        label: '最近头围',
        main: `${latest.head_cm}`,
        unit: 'cm',
        sub: formatLogTime(latest.recorded_at),
      })
    } else {
      out.push({
        key: 'w',
        label: '近期记录',
        main: '—',
        unit: '',
        sub: '该指标暂无数值',
      })
    }

    out.push({
      key: 'p',
      label: '样本数',
      main: `${records.length}`,
      unit: '条',
      sub: 'growth_records',
    })

    const weights = records.filter((r) => r.weight_kg != null).map((r) => r.weight_kg)
    let deltaText = ''
    if (weights.length >= 2) {
      const a = weights[weights.length - 2]
      const b = weights[weights.length - 1]
      const g = Math.round((b - a) * 1000)
      deltaText = `${g >= 0 ? '+' : ''}${g} g`
    }

    out.push({
      key: 'g',
      label: '体重差分',
      main: deltaText || '—',
      unit: '',
      sub: weights.length >= 2 ? '相邻两条' : '需至少两次体重',
    })

    return out.slice(0, 3)
  },

  onPickMetric(e) {
    const k = e.currentTarget.dataset.k
    if (!k || k === this.data.metricKind) return
    this.setData({ metricKind: k }, () => {
      this.loadGrowthData().then(() => this.drawGrowthChart())
    })
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

        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.strokeStyle = dark ? 'rgba(180, 178, 172, 0.35)' : '#ECEAE4'
        ctx.lineWidth = bandW
        ctx.beginPath()
        ctx.moveTo(0, h * 0.82)
        ctx.bezierCurveTo(w * 0.25, h * 0.62, w * 0.52, h * 0.42, w, h * 0.18)
        ctx.stroke()

        ctx.setLineDash([6, 4])
        ctx.strokeStyle = dark ? 'rgba(210, 208, 200, 0.55)' : 'rgba(95, 95, 93, 0.55)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(0, h * 0.85)
        ctx.bezierCurveTo(w * 0.28, h * 0.62, w * 0.58, h * 0.42, w, h * 0.2)
        ctx.stroke()
        ctx.setLineDash([])

        const pts = this._chartPts || [
          [0, 0.9],
          [0.1667, 0.74],
          [0.3333, 0.63],
          [0.5, 0.56],
          [0.6667, 0.48],
          [0.8333, 0.42],
          [1, 0.35],
        ]

        ctx.strokeStyle = dark ? '#f0eeeb' : '#1C1C1C'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(pts[0][0] * w, pts[0][1] * h)
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i][0] * w, pts[i][1] * h)
        }
        ctx.stroke()

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
    wx.showToast({ title: '导出功能开发中', icon: 'none' })
  },

  onTapClinic() {
    wx.showToast({ title: '联系诊所为演示占位', icon: 'none' })
  },

  onTapViewAllLogs() {
    wx.switchTab({ url: '/pages/record/record' })
  },

  onTapGoBabySetup() {
    wx.navigateTo({ url: '/pages/baby-setup/baby-setup' })
  },
})
