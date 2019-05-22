const path = require('path')
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env')
})
const fs = require('fs')

const stylePath = path.resolve(__dirname, '..', 'src', 'assets', 'stylesheets')
const destinationFilename = 'application.css'
let filename

if (process.env.APP_STYLES === 'classic') {
  filename = 'application.classic.css'
} else {
  filename = 'application.core.css'
}

fs.copyFileSync(path.resolve(stylePath, filename), path.resolve(stylePath, destinationFilename))
