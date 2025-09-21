// Small script to inspect the swpdb database and print collection counts
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/swpdb';
console.log('db_check connecting to', mongoUri);

async function run() {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  console.log('Collections found:', collections.map(c => c.name));
  for (const c of collections) {
    const cnt = await db.collection(c.name).countDocuments();
    console.log(`- ${c.name}: ${cnt}`);
  }
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('db_check failed:', err);
  process.exit(1);
});
