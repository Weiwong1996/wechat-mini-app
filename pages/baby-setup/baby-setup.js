const {
  getStoredSession,
  setCurrentBabyId,
} = require('../../utils/auth')
const { userPost } = require('../../utils/supabaseRest')

function toBirthIso(dateStr, timeStr) {
  if (!dateStr) return null
  const t = timeStr && String(timeStr).trim() ? timeStr : '12:00'
  const d = new Date(`${dateStr}T${t}:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

function lbOzToGrams(lbStr, ozStr) {
  const lb = Number(lbStr)
  const oz = Number(ozStr)
  if (Number.isNaN(lb) && Number.isNaN(oz)) return null
  const safeLb = Number.isNaN(lb) ? 0 : lb
  const safeOz = Number.isNaN(oz) ? 0 : oz
  const totalOz = safeLb * 16 + safeOz
  return Math.max(0, Math.round(totalOz * 28.349523125))
}

function inchesToCm(inStr) {
  const n = Number(inStr)
  if (Number.isNaN(n) || n <= 0) return null
  return Math.round(n * 2.54 * 10) / 10
}

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    step: 1,
    babyName: '',
    gender: 'boy',
    birthDate: '2024-03-14',
    birthTime: '08:30',
    weightLb: '7',
    weightOz: '4',
    lengthIn: '20.5',
    aiTracking: true,
    partnerSharing: true,
    submitting: false,
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
    wx.showToast({ title: '上传照片功能开发中', icon: 'none' })
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

  async onTapDone() {
    const name = (this.data.babyName || '').trim()
    if (!name) {
      wx.showToast({ title: '请填写宝宝姓名', icon: 'none' })
      return
    }

    const session = getStoredSession()
    if (!session || !session.user || !session.user.id) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    const birthAt = toBirthIso(this.data.birthDate, this.data.birthTime)
    const birthWeightG = lbOzToGrams(this.data.weightLb, this.data.weightOz)
    const birthLengthCm = inchesToCm(this.data.lengthIn)

    this.setData({ submitting: true })

    try {
      const rows = await userPost(
        wx,
        session.accessToken,
        'babies',
        {
          user_id: session.user.id,
          name,
          gender: this.data.gender,
          birth_at: birthAt,
          birth_weight_g: birthWeightG,
          birth_length_cm: birthLengthCm,
          prefs: {
            ai_tracking: !!this.data.aiTracking,
            partner_sharing: !!this.data.partnerSharing,
          },
        },
        { prefer: 'return=representation' }
      )

      const created = Array.isArray(rows) ? rows[0] : rows
      const id = created && created.id ? created.id : null
      if (!id) {
        throw new Error('创建失败：未返回档案 ID')
      }

      setCurrentBabyId(id, wx)

      wx.showToast({ title: '已保存', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 600)
    } catch (err) {
      wx.showToast({
        title: err && err.message ? err.message : '保存失败',
        icon: 'none',
      })
    } finally {
      this.setData({ submitting: false })
    }
  },
})
