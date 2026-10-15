const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const logger = require('./utils/logger');
const { setSocketIO } = require('./services/auditService');
const { generalApiLimiter } = require('./middleware/rateLimitMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const auditRoutes = require('./routes/auditRoutes');
const alertRoutes = require('./routes/alertRoutes');
const accessRequestRoutes = require('./routes/accessRequestRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Enable trust proxy for Render reverse proxy header inspection & rate-limiting accuracy
app.set('trust proxy', 1);

// Configure dynamic production CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
]
  .filter(Boolean)
  .flatMap((url) => url.split(',').map((u) => u.trim().replace(/\/$/, '')));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production' ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not permitted by Zero Trust CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-session-id',
    'x-device-id',
    'x-device-name',
    'x-client-location',
  ],
};

// Setup Socket.IO for continuous live SOC telemetry & alert dispatch
const io = new Server(server, {
  cors: corsOptions,
});

setSocketIO(io);

io.on('connection', (socket) => {
  logger.info(`[Socket.io] Real-time client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// Security & Utility Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors(corsOptions));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Lightweight health check endpoint for Render (exempt from rate limits and audit logs)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Zero Trust Access Platform API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Apply rate limiting to all /api endpoints
app.use('/api', generalApiLimiter);

// Health Check API within /api
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Zero Trust Access Platform API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: 'Continuous Verification Active',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Check if initial seed is needed (e.g. empty in-memory or fresh DB)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      logger.info('Database is empty. Triggering automated bootstrap seed...');
      const { seedData } = require('./seed/seedDatabase');
      await seedData(false);
      logger.info('Automated bootstrap seed finished successfully.');
    }

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`=======================================================`);
      logger.info(` Zero Trust Enterprise Access Platform API Server `);
      logger.info(` Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(` Health endpoint: http://localhost:${PORT}/health`);
      logger.info(` Socket.IO real-time event gateway initialized`);
      logger.info(` Tagline: "Never Trust, Always Verify."`);
      logger.info(`=======================================================`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server };
