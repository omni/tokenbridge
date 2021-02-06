require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { readFile } = require('./utils/file')
const { getPrometheusMetrics } = require('./prometheusMetrics')

const app = express()
const bridgeRouter = express.Router({ mergeParams: true })

app.use(cors())

app.get('/favicon.ico', (req, res) => res.sendStatus(204))
app.use('/:bridgeName', bridgeRouter)

bridgeRouter.get('/', (req, res, next) => {
  try {
    const results = readFile(`./responses/${req.params.bridgeName}/getBalances.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/validators', (req, res, next) => {
  try {
    const results = readFile(`./responses/${req.params.bridgeName}/validators.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/eventsStats', (req, res, next) => {
  try {
    const results = readFile(`./responses/${req.params.bridgeName}/eventsStats.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/alerts', (req, res, next) => {
  try {
    const results = readFile(`./responses/${req.params.bridgeName}/alerts.json`)
    res.json(results)
  } catch (e) {
    next(e)
  }
})

bridgeRouter.get('/mediators', (req, res, next) => {
  try {
    const results = readFile(`./responses/${req.params.bridgeName}/mediators.json`)
    res.json(results)
  } catch (e) {
    // this will eventually be handled by your error handling middleware
    next(e)
  }
})

bridgeRouter.get('/stuckTransfers', (req, res, next) => {
  try {
    const results = readFile(`./responses/${req.params.bridgeName}/stuckTransfers.json`)
    res.json(results)
  } catch (e) {
    next(e)
  }
})

bridgeRouter.get('/metrics', (req, res, next) => {
  try {
    const metrics = getPrometheusMetrics(req.params.bridgeName)
    res.type('text').send(metrics)
  } catch (e) {
    next(e)
  }
})

const port = process.env.MONITOR_PORT || 3003
app.set('port', port)
app.listen(port, () => console.log(`Monitoring app listening on port ${port}!`))
