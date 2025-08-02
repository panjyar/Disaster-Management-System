import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import disastersRouter from './routes/disasters.js';
import resourcesRouter from './routes/resources.js';
import socialMediaRouter from './routes/socialMedia.js';
import geocodeRouter from './routes/geocode.js';
import verificationRouter from './routes/verification.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/disasters', disastersRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/social-media', socialMediaRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/verification', verificationRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


export default app;