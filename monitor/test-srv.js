const express = require('express')

const app = express()

app.all('/', (req, res) => {
  setTimeout(() => {
    res.status(504)
    res.end()
  }, 2000)
})

const MONITOR_PORT = process.env.MONITOR_PORT || 4000
app.listen(MONITOR_PORT, () => console.log('Listening on port ' + MONITOR_PORT))
