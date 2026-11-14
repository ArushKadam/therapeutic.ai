const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const geminiRouter = require('./gemini-routes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:8080' }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/gemini', geminiRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});

module.exports = app;
