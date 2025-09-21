// One-off script to backfill missing `notes` field on orders
// Usage: node backend/scripts/fix_notes.js
require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swpdb';

async function run() {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', mongoUri);
  const db = mongoose.connection.db;
  const orders = db.collection('orders');
  const res = await orders.updateMany({ notes: { $exists: false } }, { $set: { notes: '' } });
  console.log('Matched:', res.matchedCount, 'Modified:', res.modifiedCount);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Failed to backfill notes', err);
  process.exit(1);
});
