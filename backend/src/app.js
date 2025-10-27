import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import disastersRouter from './routes/disasters.js';
import resourcesRouter from './routes/resources.js';
import socialMediaRouter from './routes/socialMedia.js';
import geocodeRouter from './routes/geocode.js';
import verificationRouter from './routes/verification.js';
import updatesRouter from './routes/updates.js';

// Import controllers for additional routes
import DisastersController from './controllers/disastersController.js';

dotenv.config();

const app = express();

// Build allowed origins
const prodOrigins = [];
if (process.env.FRONTEND_URL) prodOrigins.push(process.env.FRONTEND_URL);
if (process.env.FRONTEND_URLS) {
  prodOrigins.push(
    ...process.env.FRONTEND_URLS.split(',').map(s => s.trim()).filter(Boolean)
  );
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? prodOrigins
    : ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','x-user','x-role'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  });
}

// Health check endpoint
app.get('/health', DisastersController.healthCheck);

// API status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const status = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        'GET /health': 'System health check',
        'GET /api/status': 'API status and endpoints',
        'GET /api/disasters': 'List disasters',
        'POST /api/disasters': 'Create disaster',
        'PUT /api/disasters/:id': 'Update disaster',
        'DELETE /api/disasters/:id': 'Delete disaster',
        'POST /api/disasters/:id/reports': 'Create disaster report',
        'GET /api/resources': 'List all resources',
        'GET /api/resources/:disasterId': 'Get resources for disaster',
        'POST /api/resources': 'Create resource',
        'GET /api/social-media': 'Social media API info',
        'GET /api/social-media/:disasterId': 'Get social media reports',
        'GET /api/geocode': 'Geocoding API info',
        'POST /api/geocode': 'Geocode location',
        'GET /api/verification': 'Verification API info',
        'POST /api/verification/verify-image': 'Verify image authenticity',
        'GET /api/updates': 'List official updates'
      }
    };

    // Test database connection
    try {
      await DisastersController.healthCheck(req, res);
      return; // healthCheck will send response
    } catch (error) {
      status.database = 'error';
      status.database_error = error.message;
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/disasters', disastersRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/social-media', socialMediaRouter);
app.use('/api/geocode', geocodeRouter);
app.use('/api/verification', verificationRouter);
app.use('/api/updates', updatesRouter);

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    message: 'Disaster Management System API',
    version: '1.0.0',
    status: 'Active',
    documentation: {
      health: 'GET /health - System health check',
      status: 'GET /api/status - Detailed API status',
      disasters: 'GET /api/disasters - List all disasters',
      resources: 'GET /api/resources - List all resources',
      socialMedia: 'GET /api/social-media - Social media integration',
      geocoding: 'GET /api/geocode - Location services',
      verification: 'GET /api/verification - Image verification'
    },
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint (development only)
if (process.env.NODE_ENV !== 'production') {
  app.get('/debug/env', (req, res) => {
    res.json({
      node_env: process.env.NODE_ENV,
      port: process.env.PORT,
      supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Not set',
      supabase_key: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      gemini_key: process.env.GEMINI_API_KEY ? 'Set' : 'Not set',
      google_maps_key: process.env.GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: 'Invalid JSON in request body',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ 
      error: 'Request entity too large',
      details: 'Maximum request size is 10MB'
    });
  }

  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    timestamp: new Date().toISOString()
  });
});

// 404 handler - must be last
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/status',
      'GET /api/disasters',
      'POST /api/disasters',
      'GET /api/resources',
      'GET /api/social-media',
      'GET /api/geocode',
      'GET /api/verification'
    ],
    timestamp: new Date().toISOString()
  });
});

export default app;