const mongoose = require('mongoose');
require('../models/User');
const bcrypt = require('bcryptjs');

const NEW_PASS = process.argv[2] || 'admin123';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/swpdb');
  const User = mongoose.model('User');
  const hashed = await bcrypt.hash(NEW_PASS, 10);
  const r = await User.updateOne({ username: 'admin' }, { $set: { password: hashed } });
  console.log('admin password set to', NEW_PASS, 'updated:', r.nModified || r.modifiedCount || r.upsertedCount || r.matchedCount);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
