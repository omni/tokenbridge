const webdriver = require('selenium-webdriver');
const Twait = 20000;

class Page {

  constructor(driver) {
    this.driver = driver;
  }

  async waitUntilDisplayed(element, Twaiting) {
    let counter = Twaiting;
    if (counter === undefined) counter = 180;
    try {
      do {
        await this.driver.sleep(300);
        if (await this.isElementDisplayed(element)) return true;
      } while (counter-- > 0);
      return false;
    }
    catch (err) {
      return false;
    }
  }

  async waitUntilDisappear(element, Twaiting) {
    let counter = Twaiting;
    if (counter === undefined) counter = 180;
    try {
      do {
        await this.driver.sleep(300);
        if (!await this.isElementDisplayed(element)) return true;
      } while (counter-- > 0);
      return false;
    }
    catch (err) {
      return false;
    }
  }

  async waitUntilLocated(element, Twaiting) {
    let counter = Twaiting;
    if (counter === undefined) counter = 180;
    try {
      do {
        await this.driver.sleep(300);
        if (await this.isElementLocated(element)) return true;
      } while (counter-- > 0);
      return false;
    }
    catch (err) {
      return false;
    }
  }

  async isElementDisplayed(element) {
    try {
      return await this.driver.findElement(element).isDisplayed();
    }
    catch (err) {
      return false;
    }
  }

  async isElementLocated(element) {
    return (await this.driver.findElements(element)).length > 0;
  }

  async clickWithWait(element) {
    try {
      let field;
      if (element.constructor.name !== "WebElement") {
        field = await this.driver.wait(webdriver.until.elementLocated(element), Twait);
      }
      else field = element;
      await field.click();
      return true;
    }
    catch (err) {
      return false;
    }
  }

  async fillWithWait(element, text) {
    try {
      let field;
      if (element.constructor.name !== "WebElement") {
        field = await this.driver.wait(webdriver.until.elementLocated(element), Twait);
      }
      else field = element;
      await field.sendKeys(text);
      return true;
    }
    catch (err) {
      return false;
    }
  }

  async findWithWait(element) {
    try {
      await this.driver.wait(webdriver.until.elementLocated(element), Twait);
      return await this.driver.findElements(element);
    }
    catch (err) {
      return null;
    }
  }

  async switchToNextPage() {
    let allHandles = [];
    let curHandle;
    try {
      allHandles = await this.driver.getAllWindowHandles();
      curHandle = await this.driver.getWindowHandle();
      if (allHandles.length > 2) {
        let arr = [];
        arr[0] = allHandles[0];
        arr[1] = allHandles[1];
        allHandles = arr;
      }
      let handle;
      for (let i = 0; i < allHandles.length; i++) {
        if (curHandle !== allHandles[i]) {
          handle = allHandles[i];
          break;
        }
      }
      await this.driver.switchTo().window(handle);
      await this.driver.sleep(500);
      return true;
    }
    catch (err) {
      return false;
    }
  }

  async refresh() {
    await this.driver.navigate().refresh();
  }

  async getUrl() {
    return await this.driver.getCurrentUrl();
  }

  async open(url) {
    await this.driver.get(url);
    return this.getUrl();
  }

  async clickKey(key, times) {
    try {
      const action = this.driver.actions();
      for (let i = 0; i < times; i++)
        await action.sendKeys(key).perform();
      return true;
    }
    catch (err) {
      return false;
    }
  }

}

module.exports = {
  Page: Page
};

