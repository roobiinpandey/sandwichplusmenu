// Ultra-simple test server for Render deployment
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

console.log('🚀 Starting simple test server...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// CORS for frontend
app.use(cors({
  origin: ['https://swp-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Test routes
app.get('/', (req, res) => {
  console.log('✅ Root endpoint hit');
  res.json({ 
    message: 'SWP Test Backend is working!',
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

app.get('/ping', (req, res) => {
  console.log('✅ Ping endpoint hit');
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/menu', (req, res) => {
  console.log('✅ Menu endpoint hit');
  res.json({ 
    categories: [
      {
        name_en: 'Test Category',
        name_ar: 'فئة تجريبية',
        items: [
          {
            id: '1',
            name_en: 'Test Item',
            name_ar: 'عنصر تجريبي',
            price: 10,
            images: []
          }
        ]
      }
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`✅ Server accessible at http://0.0.0.0:${PORT}`);
});
