const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const obsService = require('../services/obsService');

const prisma = new PrismaClient();
const router = express.Router();

// Validation middleware
const obsConfigValidation = [
  body('name').notEmpty().withMessage('Connection name is required'),
  body('url').custom((value) => {
    // Check if it's a valid WebSocket URL
    const wsUrlPattern = /^wss?:\/\/.+/;
    if (!wsUrlPattern.test(value)) {
      throw new Error('Valid WebSocket URL is required (ws:// or wss://)');
    }
    return true;
  }),
  body('password').optional().isString(),
  body('sourceName').optional().isString()
];

// Connect to OBS
router.post('/connect', obsConfigValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        code: 'VALIDATION_ERROR'
      });
    }

    const { name, url, password, sourceName = 'Bible Verse' } = req.body;

    // Save connection to database first
    const savedConnection = await prisma.obsConnection.create({
      data: {
        userId: req.user.id,
        name,
        url,
        password, // In production, encrypt this
        sourceName,
        isActive: true,
        lastUsed: new Date()
      }
    });

    // Try to create live OBS connection (this may fail if OBS isn't running)
    let connection = null;
    let connectionStatus = { connected: false, authenticated: false };
    
    try {
      connection = await obsService.createConnection({
        url,
        password,
        sourceName,
        userId: req.user.id,
        dbConnectionId: savedConnection.id
      });
      connectionStatus = obsService.getConnectionStatus(connection.id);
    } catch (error) {
      console.warn(`Failed to create live OBS connection for ${name}:`, error.message);
      // Connection is saved to database but not live - this is OK
    }

    res.json({
      success: true,
      data: {
        connectionId: connection?.id || null,
        connection: savedConnection,
        status: connectionStatus
      },
      message: connection ? 'Connected to OBS successfully' : 'OBS connection saved (OBS Studio not available)'
    });
  } catch (error) {
    next(error);
  }
});

// Send verse to OBS
router.post('/send-verse', async (req, res, next) => {
  try {
    const { connectionId, verseRef, verseText, version = 'kjv' } = req.body;

    if (!connectionId || !verseRef || !verseText) {
      return res.status(400).json({
        error: 'Connection ID, verse reference, and text are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Check if connection exists in database
    const dbConnection = await prisma.obsConnection.findFirst({
      where: { id: connectionId, userId: req.user.id }
    });

    if (!dbConnection) {
      return res.status(404).json({
        error: 'OBS connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    // Try to send verse to OBS
    try {
      await obsService.sendVerse(connectionId, {
        reference: verseRef,
        text: verseText,
        version
      });

      // Log to analytics
      await prisma.analytics.create({
        data: {
          userId: req.user.id,
          action: 'verse_sent_to_obs',
          metadata: { connectionId, verseRef, version }
        }
      });

      res.json({
        success: true,
        message: 'Verse sent to OBS successfully'
      });
    } catch (error) {
      // Check if it's a connection availability error
      if (error.message === 'OBS connection not available') {
        return res.status(503).json({
          error: 'OBS Studio is not running or not accessible',
          message: 'Please ensure OBS Studio is running with the WebSocket server enabled, then try reconnecting your OBS connection.',
          code: 'OBS_NOT_AVAILABLE',
          connectionName: dbConnection.name
        });
      }
      
      // Re-throw other errors
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Get OBS connection status
router.get('/status/:connectionId', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const status = obsService.getConnectionStatus(connectionId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

// Get user's OBS connections
router.get('/connections', async (req, res, next) => {
  try {
    const connections = await prisma.obsConnection.findMany({
      where: { userId: req.user.id },
      orderBy: { lastUsed: 'desc' }
    });

    // Get live connection statuses
    const connectionsWithStatus = connections.map(conn => {
      const liveConnections = obsService.getUserConnections(req.user.id);
      const liveStatus = liveConnections.find(lc => 
        lc.config.url === conn.url && lc.config.sourceName === conn.sourceName
      );

      return {
        ...conn,
        connected: liveStatus ? liveStatus.status.connected : false,
        liveStatus: liveStatus ? liveStatus.status : { connected: false, authenticated: false }
      };
    });

    res.json({
      success: true,
      data: connectionsWithStatus
    });
  } catch (error) {
    next(error);
  }
});

// Get OBS scenes
router.get('/scenes/:connectionId', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    const scenes = await obsService.getScenes(connectionId);

    res.json({
      success: true,
      data: scenes
    });
  } catch (error) {
    next(error);
  }
});

// Switch OBS scene
router.post('/switch-scene', async (req, res, next) => {
  try {
    const { connectionId, sceneName } = req.body;

    if (!connectionId || !sceneName) {
      return res.status(400).json({
        error: 'Connection ID and scene name are required',
        code: 'MISSING_FIELDS'
      });
    }

    await obsService.switchScene(connectionId, sceneName);

    // Log to analytics
    await prisma.analytics.create({
      data: {
        userId: req.user.id,
        action: 'obs_scene_switched',
        metadata: { connectionId, sceneName }
      }
    });

    res.json({
      success: true,
      message: 'Scene switched successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Update OBS connection
router.put('/connections/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url, password, sourceName, isActive } = req.body;

    const connection = await prisma.obsConnection.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!connection) {
      return res.status(404).json({
        error: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    const updatedConnection = await prisma.obsConnection.update({
      where: { id },
      data: {
        name,
        url,
        password,
        sourceName,
        isActive,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: updatedConnection,
      message: 'Connection updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Delete OBS connection
router.delete('/connections/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const connection = await prisma.obsConnection.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!connection) {
      return res.status(404).json({
        error: 'Connection not found',
        code: 'CONNECTION_NOT_FOUND'
      });
    }

    // Close live connection if exists
    const liveConnections = obsService.getUserConnections(req.user.id);
    const liveConnection = liveConnections.find(lc => 
      lc.config.url === connection.url && lc.config.sourceName === connection.sourceName
    );

    if (liveConnection) {
      obsService.closeConnection(liveConnection.id);
    }

    await prisma.obsConnection.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Connection deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Disconnect from OBS
router.post('/disconnect/:connectionId', async (req, res, next) => {
  try {
    const { connectionId } = req.params;
    
    obsService.closeConnection(connectionId);

    res.json({
      success: true,
      message: 'Disconnected from OBS successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
