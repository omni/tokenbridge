const puppeteer = require('puppeteer')
const { waitUntil } = require('./utils/utils')

jest.setTimeout(60000)

const statusText = 'Success'
const statusSelector = 'label[data-id="status"]'

const homeToForeignTxURL = 'http://localhost:3004/77/0x295efbe6ae98937ef35d939376c9bd752b4dc6f6899a9d5ddd6a57cea3d76c89'
const foreignToHomeTxURL = 'http://localhost:3004/42/0x7262f7dbe6c30599edded2137fbbe93c271b37f5c54dd27f713f0cf510e3b4dd'

describe('ALM', () => {
  let browser
  let page

  beforeAll(async () => {
    browser = await puppeteer.launch()
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
