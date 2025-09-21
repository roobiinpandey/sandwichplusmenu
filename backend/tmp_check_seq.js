const app = require('./index');
const request = require('supertest');

async function run() {
  const payload = (n) => ({ customer: 'CHK' + n, items: [{ name: 'X', quantity: 1, price: 1 }], total: 1 });
  const promises = [];
  for (let i = 0; i < 12; i++) promises.push(request(app).post('/orders').send(payload(i)).set('Content-Type','application/json'));
  const results = await Promise.all(promises);
  results.forEach((r, i) => {
    if (r.body && r.body.order) {
      console.log(i, r.body.order._id, r.body.order.orderSeq, r.body.order.orderNumber);
    } else {
      console.log(i, 'ERR', r.status, r.text.slice(0,200));
    }
  });
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
