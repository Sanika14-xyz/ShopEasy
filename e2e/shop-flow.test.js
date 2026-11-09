const assert = require('node:assert/strict');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const baseUrl = process.env.SHOPEASY_BASE_URL || 'http://localhost:8080';

async function runShopFlow() {
  const options = new chrome.Options().addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage'
  );
  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    await driver.manage().window().setRect({ width: 1280, height: 900 });
    const waitFor = async (condition, description) => {
      const result = await driver.wait(condition, 30_000, `Timed out while ${description}`);
      console.log(`Passed: ${description}`);
      return result;
    };

    await driver.get(`${baseUrl}/search`);
    console.log(`Opened storefront at ${baseUrl}/search`);

    await waitFor(
      until.elementLocated(By.id('product-search')),
      'waiting for the product search field'
    );
    for (const character of 'backpack') {
      await driver.findElement(By.id('product-search')).sendKeys(character);
    }

    await waitFor(
      async () => (
        (await driver.findElement(By.css('.section-heading h2')).getText()) === '1 find'
      ),
      'finding the matching backpack'
    );

    const product = await waitFor(
      until.elementLocated(By.css('.product-card')),
      'waiting for the matching product card'
    );
    assert.match(await product.getText(), /Everyday Backpack/);
    const addButton = await product.findElement(By.css('.product-buy button'));
    await addButton.sendKeys(Key.ENTER);

    await waitFor(
      async () => (await driver.findElement(By.css('.cart-link')).getText())
        .replace(/\s+/g, ' ')
        .trim()
        .includes('Your bag 1'),
      'confirming the product was added to the bag'
    );
    const cartLink = await driver.findElement(By.css('.cart-link'));
    await cartLink.sendKeys(Key.ENTER);

    const cartTitle = await waitFor(
      until.elementLocated(By.css('main h1')),
      'waiting for the bag page'
    );
    assert.equal(await cartTitle.getText(), 'Your bag (1)');
    assert.match(await driver.findElement(By.css('.cart-list')).getText(), /Everyday Backpack/);

    console.log('Selenium shop flow passed: search, add to bag, and verify cart.');
  } finally {
    await driver.quit();
  }
}

runShopFlow().catch((error) => {
  console.error('Selenium shop flow failed:', error);
  process.exitCode = 1;
});
