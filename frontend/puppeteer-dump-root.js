const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:3000/';
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
  page.on('pageerror', err => logs.push({type: 'pageerror', text: err.message}));
  await page.goto(url, {waitUntil: 'networkidle2', timeout: 10000}).catch(e => logs.push({type:'goto-error', text: e.message}));
  // Wait for menu items to render if present
  try {
    await page.waitForSelector('.menu-card', { timeout: 4000 });
  } catch (e) {
    // no menu-card found within timeout; proceed to capture current DOM
  }
  const rootHtml = await page.evaluate(() => {
    const el = document.getElementById('root');
    return el ? el.innerHTML : null;
  }).catch(e => null);
  console.log('CONSOLE_LOGS_START');
  console.log(JSON.stringify(logs, null, 2));
  console.log('CONSOLE_LOGS_END');
  console.log('ROOT_INNER_HTML_START');
  console.log(rootHtml);
  console.log('ROOT_INNER_HTML_END');
  await browser.close();
})();
