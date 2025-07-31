const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const disasterRoutes = require('./routes/disasters');
const geocodeRoutes = require('./routes/geocode');
const socialMediaRoutes = require('./routes/socialMedia');
const resourceRoutes = require('./routes/resources');
const verificationRoutes = require('./routes/verification');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/disasters', disasterRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/verification', verificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});
console.log('Exporting Express app...');
module.exports = app;
