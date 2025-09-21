const fs = require('fs');
const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:3000/';
  const out = process.argv[3] || '/tmp/frontend-screenshot.png';
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push({type: msg.type(), text: msg.text()}));
  page.on('pageerror', err => logs.push({type: 'pageerror', text: err.message}));
  await page.goto(url, {waitUntil: 'networkidle2', timeout: 10000}).catch(e => logs.push({type:'goto-error', text: e.message}));
  await page.screenshot({path: out, fullPage: true}).catch(e => logs.push({type:'screenshot-error', text: e.message}));
  console.log('LOGS_START');
  console.log(JSON.stringify(logs, null, 2));
  console.log('LOGS_END');
  console.log('SCREENSHOT', out);
  await browser.close();
})();
