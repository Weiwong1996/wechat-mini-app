const assert = require('node:assert/strict')
const fs = require('node:fs')
const test = require('node:test')

const jsonFiles = [
  'app.json',
  'project.config.json',
  'sitemap.json',
  'theme.json',
  'pages/login/login.json',
  'pages/index/index.json',
  'pages/record/record.json',
  'pages/ask/ask.json',
  'pages/growth/growth.json',
  'pages/profile/profile.json',
  'pages/baby-setup/baby-setup.json'
]

const requiredFiles = [
  'app.js',
  'app.json',
  'app.wxss',
  'project.config.json',
  'sitemap.json',
  'theme.json',
  'utils/config.js',
  'utils/auth.js',
  'utils/supabaseRest.js',
  'utils/babyContext.js',
  'utils/recordUi.js',
  'utils/theme.js',
  'behaviors/theme.js',
  'custom-tab-bar/index.js',
  'custom-tab-bar/index.json',
  'custom-tab-bar/index.wxml',
  'custom-tab-bar/index.wxss',
  'pages/login/login.js',
  'pages/login/login.wxml',
  'pages/login/login.wxss',
  'pages/login/login.json',
  'pages/index/index.js',
  'pages/index/index.wxml',
  'pages/index/index.wxss',
  'pages/index/index.json',
  'pages/record/record.js',
  'pages/record/record.wxml',
  'pages/record/record.wxss',
  'pages/record/record.json',
  'pages/ask/ask.js',
  'pages/ask/ask.wxml',
  'pages/ask/ask.wxss',
  'pages/ask/ask.json',
  'pages/growth/growth.js',
  'pages/growth/growth.wxml',
  'pages/growth/growth.wxss',
  'pages/growth/growth.json',
  'pages/profile/profile.js',
  'pages/profile/profile.wxml',
  'pages/profile/profile.wxss',
  'pages/profile/profile.json',
  'pages/baby-setup/baby-setup.js',
  'pages/baby-setup/baby-setup.wxml',
  'pages/baby-setup/baby-setup.wxss',
  'pages/baby-setup/baby-setup.json',
  'docs/stitch_mcp.md'
]

test('miniprogram JSON files are valid', () => {
  for (const file of jsonFiles) {
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(file, 'utf8')), file)
  }
})

test('required miniprogram files exist', () => {
  for (const file of requiredFiles) {
    assert.equal(fs.existsSync(file), true, `${file} should exist`)
  }
})

test('app.json registers expected pages', () => {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'))

  assert.deepEqual(appJson.pages, [
    'pages/login/login',
    'pages/index/index',
    'pages/record/record',
    'pages/ask/ask',
    'pages/growth/growth',
    'pages/profile/profile',
    'pages/baby-setup/baby-setup'
  ])
})
