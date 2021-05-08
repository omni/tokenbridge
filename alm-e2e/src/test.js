const puppeteer = require('puppeteer')
const { waitUntil } = require('./utils/utils')

jest.setTimeout(60000)

const statusText = 'Success'
const statusSelector = 'label[data-id="status"]'

const homeToForeignTxURL = 'http://localhost:3004/77/0xbc83d43bdc675a615a2b820e43e52d25857aa5fdd77acf2dd92cd247af2c693c'
const foreignToHomeTxURL = 'http://localhost:3004/42/0x09dfb947dbd17e27bcc117773b6e133829f7cef9646199a93ef019c4f7c0fec6'

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
