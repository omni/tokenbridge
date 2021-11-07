const fs = require('fs')
const path = require('path')

function readFile(filePath, parseJson = true) {
  try {
    const content = fs.readFileSync(filePath)
    if (!parseJson) return content
    const json = JSON.parse(content)
    const timeDiff = Math.floor(Date.now() / 1000) - json.lastChecked
    return Object.assign({}, json, { timeDiff })
  } catch (_) {
    console.error(`File ${filePath} does not exist`)
    return {
      error: 'the bridge statistics are not available'
    }
  }
}

function writeFile(filePath, object, paramOptions = {}) {
  const defaultOptions = {
    useCwd: true,
    stringify: true
  }
  const { useCwd, stringify } = Object.assign({}, defaultOptions, paramOptions)

  const fullPath = useCwd ? path.join(process.cwd(), filePath) : filePath
  fs.writeFileSync(fullPath, stringify ? JSON.stringify(object, null, 4) : object)
}

function createDir(dirPath) {
  try {
    fs.mkdirSync(path.join(process.cwd(), dirPath), { recursive: true })
  } catch (e) {
    if (!e.message.includes('exists')) {
      throw e
    }
  }
}

function readCacheFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath))
  } catch (_) {
    return false
  }
}

function writeCacheFile(filePath, object) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(object))
}

function readAccessListFile(filePath) {
  const data = fs.readFileSync(filePath)
  return data
    .toString()
    .split('\n')
    .map(addr => addr.trim().toLowerCase())
    .filter(addr => addr.length === 42)
}

module.exports = {
  readFile,
  writeFile,
  createDir,
  readCacheFile,
  writeCacheFile,
  readAccessListFile
}
