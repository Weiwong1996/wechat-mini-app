/** 将 PostgREST 文档行映射为 record 页列表项 */
const CAT_ICON = {
  feeding: '🍼',
  sleep: '🌙',
  growth: '📏',
  mood: '😊',
  diaper: '🧷',
  note: '📝',
  general: '📝',
}

function pickIcon(recordType) {
  if (!recordType) return '📝'
  return CAT_ICON[recordType] || '📝'
}

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`
}

function formatRecordTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function formatDateLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** @returns 相对「自然日」的 today / yesterday */
function dayBucket(recordedAt) {
  if (!recordedAt) return 'today'
  const d = new Date(recordedAt)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfRecord = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round(
    (startOfToday - startOfRecord) / (24 * 60 * 60 * 1000)
  )
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  return 'older'
}

function statusUi(status) {
  const normalized = (status || '').toLowerCase()
  if (normalized === 'indexed' || normalized === 'published') {
    return { status: 'indexed', statusDot: 'green' }
  }
  return { status: 'indexing', statusDot: 'amber' }
}

/**
 * @param {object} doc PostgREST documents 行
 * @param {string} titleFallback cat 对应中文
 */
function documentToLogItem(doc, titleFallback = '记录') {
  const cat = doc.record_type || 'note'
  const title = doc.title && String(doc.title).trim() ? doc.title : titleFallback
  const subParts = []
  const t = formatRecordTime(doc.recorded_at)
  if (t) subParts.push(t)
  const body = doc.body ? String(doc.body).trim() : ''
  const timeLine = subParts.length ? subParts.join(' · ') : formatDateLabel(doc.recorded_at)

  const item = {
    id: doc.id,
    cat,
    icon: pickIcon(cat),
    title,
    timeLine,
    ...statusUi(doc.status),
    body: body || '',
  }

  return item
}

function titleForCat(cat) {
  const map = {
    feeding: '喂养记录',
    sleep: '睡眠记录',
    growth: '成长记录',
    mood: '情绪记录',
    diaper: '尿布记录',
    note: '随手记',
    general: '记录',
  }
  return map[cat] || '记录'
}

function relativeTimeShort(iso) {
  if (!iso) return '刚刚'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffMs = Date.now() - then
  const m = Math.floor(diffMs / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  return `${d} 天前`
}

module.exports = {
  CAT_ICON,
  documentToLogItem,
  titleForCat,
  dayBucket,
  relativeTimeShort,
  formatRecordTime,
  pickIcon,
}
