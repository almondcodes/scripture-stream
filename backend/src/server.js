const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const verseRoutes = require('./routes/verses');
const playlistRoutes = require('./routes/playlists');
const obsRoutes = require('./routes/obs');
const userRoutes = require('./routes/users');
const templateRoutes = require('./routes/templates');
const obsService = require('./services/obsService');

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(limiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/verses', verseRoutes); // Some routes need auth, some don't - handled in route file
app.use('/api/playlists', authenticateToken, playlistRoutes);
app.use('/api/obs', authenticateToken, obsRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/templates', templateRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Handle verse broadcasting
  socket.on('broadcast-verse', async (data) => {
    try {
      const { verseRef, verseText, userId } = data;
      
      // Broadcast to all connected clients
      io.emit('verse-updated', {
        verseRef,
        verseText,
        userId,
        timestamp: new Date().toISOString()
      });

      // Log analytics
      await prisma.analytics.create({
        data: {
          userId,
          action: 'verse_broadcast',
          metadata: { verseRef, verseText }
        }
      });
    } catch (error) {
      console.error('Error broadcasting verse:', error);
      socket.emit('error', { message: 'Failed to broadcast verse' });
    }
  });

  // Handle playlist updates
  socket.on('playlist-updated', async (data) => {
    try {
      const { playlistId, userId } = data;
      
      // Notify all users in the same room
      socket.to(`user-${userId}`).emit('playlist-changed', {
        playlistId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating playlist:', error);
      socket.emit('error', { message: 'Failed to update playlist' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

const PORT = process.env.PORT || 3001;

// Startup function to restore OBS connections
async function startup() {
  try {
    // Restore OBS connections from database
    const savedConnections = await prisma.obsConnection.findMany({
      where: { isActive: true }
    });
    
    if (savedConnections.length > 0) {
      await obsService.restoreConnections(savedConnections);
    }
  } catch (error) {
    console.error('Error during startup:', error);
  }
}

server.listen(PORT, async () => {
  console.log(`🚀 ScriptureStream Backend running on port ${PORT}`);
  console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
  
  // Run startup tasks
  await startup();
});

module.exports = { app, server, io, prisma };
