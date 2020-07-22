const puppeteer = require('puppeteer')
const { waitUntil } = require('./utils/utils')

jest.setTimeout(60000)

const statusText = 'Success'
const statusSelector = 'label[data-id="status"]'

const homeToForeignTxURL = 'http://localhost:3004/77/0x58e7d63368335b9591d4dbb43889084f698fcee93ab7656fd7a39d8c66bc4b60'
const foreignToHomeTxURL = 'http://localhost:3004/42/0x592bf28fc896419d2838f71cd0388775814b692688f1ecd5b1519081566b994a'

describe('ALM', () => {
  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false, defaultViewport: null }) // { headless: false, defaultViewport: null }
    page = await browser.newPage()
  })

  afterAll(async () => {
    await browser.close()
  })

  it('should be titled "AMB Live Monitoring"', async () => {
    await page.goto(foreignToHomeTxURL)

    await expect(page.title()).resolves.toMatch('AMB Live Monitoring')
  })
  it('should display information of foreign to home transaction', async () => {
    await page.goto(foreignToHomeTxURL)

    await page.waitForSelector(statusSelector)
    await waitUntil(async () => {
      const element = await page.$(statusSelector)
      const text = await page.evaluate(element => element.textContent, element)
      return text === statusText
    })
  })
  it('should display information of home to foreign transaction', async () => {
    await page.goto(homeToForeignTxURL)

    await page.waitForSelector(statusSelector)
    await waitUntil(async () => {
      const element = await page.$(statusSelector)
      const text = await page.evaluate(element => element.textContent, element)
      return text === statusText
    })
  })
})
