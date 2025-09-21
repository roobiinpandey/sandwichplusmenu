// Ultra-minimal backend for deployment testing
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

console.log('Starting server...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

app.get('/', (req, res) => {
  console.log('Root endpoint hit');
  res.json({ 
    message: 'SWP Backend is working! v2', 
    port: PORT,
    env: process.env.NODE_ENV 
  });
});

app.get('/ping', (req, res) => {
  console.log('Ping endpoint hit');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/menu', (req, res) => {
  console.log('Menu endpoint hit');
  res.json({ categories: [{ name_en: 'Test Category', items: [] }] });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Server bound to 0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
