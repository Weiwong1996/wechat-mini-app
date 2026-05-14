/**
 * One-off Stitch MCP JSON-RPC helper (local use; reads API key from .cursor/mcp.json).
 * JSON-RPC method: tools/call with params { name, arguments }
 */
import fs from 'node:fs'

const mc = JSON.parse(fs.readFileSync(new URL('../.cursor/mcp.json', import.meta.url), 'utf8'))
const url = mc.mcpServers.stitch.url
const key = mc.mcpServers.stitch.headers['X-Goog-Api-Key']

let id = 0
async function callTool(name, args) {
  const body = {
    jsonrpc: '2.0',
    id: ++id,
    method: 'tools/call',
    params: { name, arguments: args },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (data.error) throw new Error(`${name}: ${JSON.stringify(data.error)}`)
  const text = data.result?.content?.[0]?.text
  if (!text) return data.result
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

const project = await callTool('create_project', { title: 'WeChat parenting mini-program static UI' })
const projectId = project.projectId ?? project.project?.projectId ?? project.name?.split('/')?.pop()
if (!projectId) {
  console.error('Unexpected create_project:', project)
  process.exit(1)
}
console.log('projectId', projectId)

const ds = await callTool('create_design_system', {
  projectId,
  designSystem: {
    displayName: 'ParentingApp',
    theme: {
      colorMode: 'LIGHT',
      headlineFont: 'PLUS_JAKARTA_SANS',
      bodyFont: 'DM_SANS',
      roundness: 'ROUND_TWELVE',
      customColor: '#0d9488',
      colorVariant: 'TONAL_SPOT',
      overridePrimaryColor: '#0d9488',
      overrideSecondaryColor: '#14b8a6',
    },
  },
})
const designSystemId =
  ds.designSystemId ?? ds.assetId ?? ds.name?.split('/').pop() ?? ds.designSystem?.name
console.log('designSystem', designSystemId, JSON.stringify(ds).slice(0, 200))

const screens = [
  {
    key: 'dashboard',
    prompt: `Mobile app dashboard for a WeChat mini-program for parents. Light, calm UI. Top: greeting and small user/session status card (no document list). Middle: 3 large tappable shortcut cards in a grid: "录入" (record baby notes), "问答" (ask AI), "成长曲线" (growth charts). Bottom padding for thumb zone. Teal accent, soft gray background, rounded cards. Chinese labels.`,
  },
  {
    key: 'record',
    prompt: `Mobile screen: natural language input for baby daily records. Title 录入. Large multiline text area, hint in Chinese. Primary button 提交. Calm parenting app style, teal accent, matches dashboard.`,
  },
  {
    key: 'ask',
    prompt: `Mobile RAG Q&A screen. Title 问答. Input field + send button. Below: static placeholder area for answer and citation snippets in Chinese. Teal accent, clean cards.`,
  },
  {
    key: 'growth',
    prompt: `Mobile growth chart hub. Title 成长曲线. Simple list of metrics (身高, 体重, 头围) with placeholder values and a note "静态演示". Optional simple line chart placeholder block. Teal accent, no real chart library look—clean mock.`,
  },
]

const out = { projectId, designSystemId, screens: [] }

for (const s of screens) {
  console.log('generating', s.key, '...')
  const gen = await callTool('generate_screen_from_text', {
    projectId,
    designSystem: designSystemId,
    deviceType: 'MOBILE',
    modelId: 'GEMINI_3_FLASH',
    prompt: s.prompt,
  })
  out.screens.push({ key: s.key, response: gen })
  console.log(s.key, JSON.stringify(gen).slice(0, 300))
}

fs.writeFileSync(new URL('../stitch-output.json', import.meta.url), JSON.stringify(out, null, 2), 'utf8')
console.log('Wrote stitch-output.json (resource names / metadata only)')
