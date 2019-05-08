const express = require('express')

const app = express()

app.all('/', (req, res) => {
  setTimeout(() => {
    res.status(504)
    res.end()
  }, 2000)
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('Listening on port ' + PORT))
