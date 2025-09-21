#!/usr/bin/env node
// restore_orders_from_json.js
// Safely import orders from backend/orders.json into MongoDB.
// For each order, this script will assign a unique daily sequence (orderSeq)
// based on the current max in the DB to avoid unique index violations.

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swpdb';
const ORDERS_JSON = process.argv[2] || path.join(__dirname, '..', 'orders.json');

async function main() {
  if (!fs.existsSync(ORDERS_JSON)) {
    console.error('Orders JSON not found at', ORDERS_JSON);
    process.exit(1);
  }
  const raw = fs.readFileSync(ORDERS_JSON, 'utf8');
  let arr;
  try {
    arr = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse JSON:', e.message);
    process.exit(1);
  }
  if (!Array.isArray(arr)) {
    console.error('Expected JSON array');
    process.exit(1);
  }

  console.log('Connecting to MongoDB at', MONGO_URI);
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');

  // group by derived orderDate (YYYYMMDD) from time field (fall back to today)
  const groups = new Map();
  for (const entry of arr) {
    let time = entry.time ? new Date(entry.time) : new Date();
    const orderDate = time.toISOString().slice(0,10).replace(/-/g,'');
    if (!groups.has(orderDate)) groups.set(orderDate, []);
    groups.get(orderDate).push({ entry, time, orderDate });
  }

  for (const [orderDate, items] of groups.entries()) {
    // sort by time ascending so earlier orders keep smaller seq
    items.sort((a,b) => a.time - b.time);

    // find current max orderSeq for this date
    const maxDoc = await Order.findOne({ orderDate }).sort({ orderSeq: -1 }).lean();
    let nextSeq = (maxDoc && typeof maxDoc.orderSeq === 'number') ? maxDoc.orderSeq + 1 : 1;
    console.log(`Importing ${items.length} orders for ${orderDate}, starting seq ${nextSeq}`);

    for (const { entry, time } of items) {
      // skip if already imported by legacy id or by exact time+customer+total
      const legacyId = entry.id || entry._id || null;
      let exists = null;
      if (legacyId) {
        exists = await Order.findOne({ legacyId }).lean();
      }
      if (!exists) {
        exists = await Order.findOne({ time: new Date(entry.time), customer: entry.customer, total: entry.total }).lean();
      }
      if (exists) {
        console.log('Skipping existing order', legacyId || entry.time || '(match)');
        continue;
      }

      const orderSeq = nextSeq++;
      const seq = String(orderSeq).padStart(4, '0');
      const orderNumber = `${seq}-${orderDate}`;

      const doc = {
        customer: entry.customer || entry.name || 'Unknown',
        phone: entry.phone || '',
        items: entry.items || [],
        notes: entry.notes || entry.note || '',
        status: entry.status || 'pending',
        total: entry.total || 0,
        time: entry.time ? new Date(entry.time) : new Date(),
        orderDate,
        orderSeq,
        orderNumber,
        legacyId: legacyId || null
      };

      try {
        await Order.create(doc);
        console.log('Inserted order', doc.orderNumber, doc.customer);
      } catch (e) {
        console.error('Failed to insert order', doc.orderNumber, e.message);
        // if duplicate key happens, adjust nextSeq and continue
        if (e.code === 11000) {
          console.warn('Duplicate key while inserting; incrementing seq and retrying');
          // recompute nextSeq from DB
          const freshMax = await Order.findOne({ orderDate }).sort({ orderSeq: -1 }).lean();
          nextSeq = (freshMax && typeof freshMax.orderSeq === 'number') ? freshMax.orderSeq + 1 : nextSeq + 1;
        }
      }
    }
  }

  console.log('Done importing. Closing DB connection.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
