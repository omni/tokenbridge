const path = require('path')
require('dotenv').config({
  path: path.join(__dirname, process.env.NODE_ENV === 'test' ? './test/test.env' : './.env')
})
