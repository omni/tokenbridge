require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { readFile } = require('./utils/file')

const app = express()
const bridgeRouter = express.Router({ mergeParams: true })

app.use(cors())

app.get('/favicon.ico', (req, res) => res.sendStatus(204))
app.use('/:bridgeName', bridgeRouter)

bridgeRouter.get('/', async (req, res, next) => {
  try {
    const results = await readFile(`./responses/${req.params.bridgeName}/getBalances.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/validators', async (req, res, next) => {
  try {
    const results = await readFile(`./responses/${req.params.bridgeName}/validators.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/eventsStats', async (req, res, next) => {
  try {
    const results = await readFile(`./responses/${req.params.bridgeName}/eventsStats.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/alerts', async (req, res, next) => {
  try {
    const results = await readFile(`./responses/${req.params.bridgeName}/alerts.json`)
    res.json(results)
  } catch (e) {
    next(e)
  }
})

bridgeRouter.get('/mediators', async (req, res, next) => {
  try {
    const results = await readFile(`./responses/${req.params.bridgeName}/mediators.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/stuckTransfers', async (req, res, next) => {
  try {
    const results = await readFile(`./responses/${req.params.bridgeName}/stuckTransfers.json`)
    res.json(results)
  } catch (e) {
    next(e)
  }
})

const port = process.env.MONITOR_PORT || 3003
app.set('port', port)
app.listen(port, () => console.log(`Monitoring app listening on port ${port}!`))
