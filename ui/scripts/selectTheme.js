const path = require('path')
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env')
})
const fs = require('fs')

const stylePath = path.resolve(__dirname, '..', 'src', 'assets', 'stylesheets')
const destinationFilename = 'application.css'
const theme = process.env.UI_STYLES || 'core'
const filename = `application.${theme}.css`

fs.copyFileSync(path.resolve(stylePath, filename), path.resolve(stylePath, destinationFilename))
