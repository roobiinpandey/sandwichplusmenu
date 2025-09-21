// Basic Express server to test deployment
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  'https://swp-frontend.onrender.com',
  'https://sandwichplusmenu.onrender.com'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Basic routes
app.get('/', (req, res) => res.json({ message: 'SWP Backend API is running' }));
app.get('/ping', (req, res) => res.json({ ok: true }));
app.get('/menu', (req, res) => res.json({ categories: [] })); // Placeholder

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
