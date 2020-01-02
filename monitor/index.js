require('dotenv').config()
const express = require('express')
const fs = require('fs')

const app = express()

async function readFile(path) {
  try {
    const content = await fs.readFileSync(path)
    const json = JSON.parse(content)
    const timeDiff = Math.floor(Date.now() / 1000) - json.lastChecked
    return Object.assign({}, json, { timeDiff })
  } catch (e) {
    console.error(e)
    return {
      error: 'please check your worker'
    }
  }
}

app.get('/', async (req, res, next) => {
  try {
    const results = await readFile('./responses/getBalances.json')
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

app.get('/validators', async (req, res, next) => {
  try {
    const results = await readFile('./responses/validators.json')
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

app.get('/eventsStats', async (req, res, next) => {
  try {
    const results = await readFile('./responses/eventsStats.json')
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

app.get('/alerts', async (req, res, next) => {
  try {
    const results = await readFile('./responses/alerts.json')
    res.json(results)
  } catch (e) {
    next(e)
  }
})

app.get('/stuckTransfers', async (req, res, next) => {
  try {
    const results = await readFile('./responses/stuckTransfers.json')
    res.json(results)
  } catch (e) {
    next(e)
  }
})

const port = process.env.MONITOR_PORT || 3003
app.set('port', port)
app.listen(port, () => console.log(`Monitoring app listening on port ${port}!`))
