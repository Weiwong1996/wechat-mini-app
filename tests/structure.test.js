const assert = require('node:assert/strict')
const fs = require('node:fs')
const test = require('node:test')

const jsonFiles = [
  'app.json',
  'project.config.json',
  'sitemap.json',
  'pages/login/login.json',
  'pages/index/index.json'
]

const requiredFiles = [
  'app.js',
  'app.json',
  'app.wxss',
  'project.config.json',
  'sitemap.json',
  'utils/config.js',
  'utils/auth.js',
  'pages/login/login.js',
  'pages/login/login.wxml',
  'pages/login/login.wxss',
  'pages/login/login.json',
  'pages/index/index.js',
  'pages/index/index.wxml',
  'pages/index/index.wxss',
  'pages/index/index.json'
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

test('app.json registers login and index pages in order', () => {
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'))

  assert.deepEqual(appJson.pages, [
    'pages/login/login',
    'pages/index/index'
  ])
})
