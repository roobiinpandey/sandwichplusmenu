const puppeteer = require('puppeteer');
(async () => {
  const url = process.argv[2] || 'http://localhost:3000/';
  const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const page = await browser.newPage();
  const responses = [];
  page.on('response', async (response) => {
    try {
      const req = response.request();
      const url = req.url();
      const method = req.method();
      const status = response.status();
      if (url.includes('/menu') || url.includes('/orders') || url.endsWith('/')) {
        let text = '';
        try { text = await response.text(); } catch(e) { text = '<no-text>'; }
        responses.push({url, method, status, textSnippet: text.slice(0,300)});
      }
    } catch (e) {}
  });
  page.on('requestfailed', req => responses.push({url: req.url(), failure: true, err: req.failure && req.failure().errorText}));
  await page.goto(url, {waitUntil: 'networkidle2', timeout: 10000}).catch(e=>{});
  console.log(JSON.stringify(responses, null, 2));
  await browser.close();
})();
