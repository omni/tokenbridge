require('dotenv').config()
const express = require('express')
const fs = require('fs')
const { isV1Bridge } = require('./utils/serverUtils')

const app = express()

const LEFT_TX_THRESHOLD = Number(process.env.LEFT_TX_THRESHOLD) || 100
console.log('LEFT_TX_THRESHOLD = ' + LEFT_TX_THRESHOLD)

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

async function initV1routes(app) {
  const exposeV1Routes = await isV1Bridge()
  if (exposeV1Routes) {
    app.get('/stuckTransfers', async (req, res, next) => {
      try {
        const results = await readFile('./responses/stuckTransfers.json')
        results.ok = results.total.length === 0
        res.json(results)
      } catch (e) {
        next(e)
      }
    })
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
    results.homeOk = true
    results.foreignOk = true
    for (const hv in results.home.validators) {
      if (results.home.validators[hv].leftTx < LEFT_TX_THRESHOLD) {
        results.homeOk = false
        break
      }
    }
    for (const hv in results.foreign.validators) {
      if (results.foreign.validators[hv].leftTx < LEFT_TX_THRESHOLD) {
        results.foreignOk = false
        break
      }
    }
    results.ok = results.homeOk && results.foreignOk
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

// responses/eventsStats.json
app.get('/eventsStats', async (req, res, next) => {
  try {
    const results = await readFile('./responses/eventsStats.json')
    results.ok =
      results.onlyInHomeDeposits.length === 0 &&
      results.onlyInForeignDeposits.length === 0 &&
      results.onlyInHomeWithdrawals.length === 0 &&
      results.onlyInForeignWithdrawals.length === 0
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

app.get('/alerts', async (req, res, next) => {
  try {
    const results = await readFile('./responses/alerts.json')
    results.ok = !results.executeAffirmations.mostRecentTxHash && !results.executeSignatures.mostRecentTxHash
    res.json(results)
  } catch (e) {
    next(e)
  }
})

initV1routes(app)

const port = process.env.PORT || 3003
app.set('port', port)
app.listen(port, () => console.log(`Monitoring app listening on port ${port}!`))
