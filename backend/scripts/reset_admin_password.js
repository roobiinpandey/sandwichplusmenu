const mongoose = require('mongoose');
require('../models/User');
const bcrypt = require('bcryptjs');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/swpdb');
  const User = mongoose.model('User');
  const hashed = await bcrypt.hash('new-admin-pass-123', 10);
  await User.updateOne({ username: 'admin' }, { $set: { password: hashed } });
  console.log('admin password reset');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
