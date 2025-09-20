const WebSocket = require('ws');
const crypto = require('crypto');

class ObsService {
  constructor() {
    this.connections = new Map(); // Store multiple OBS connections
  }

  /**
   * Hash a string using SHA-256
   * @param {string} message - Message to hash
   * @returns {string} Base64 encoded hash
   */
  async hashSHA256(message) {
    return crypto.createHash('sha256').update(message).digest('base64');
  }

  /**
   * Create a new OBS WebSocket connection
   * @param {Object} config - Connection configuration
   * @returns {Promise<Object>} Connection object
   */
  async createConnection(config) {
    const {
      url = process.env.OBS_DEFAULT_URL || 'ws://localhost:4455',
      password = process.env.OBS_DEFAULT_PASSWORD,
      sourceName = process.env.OBS_DEFAULT_SOURCE_NAME || 'Bible Verse',
      userId = null,
      dbConnectionId = null
    } = config;

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const connectionId = `${userId || 'anonymous'}_${Date.now()}`;
      
      let isAuthenticated = false;
      let isConnected = false;

      const connection = {
        id: connectionId,
        dbConnectionId, // Store the database connection ID for mapping
        ws,
        config: { url, password, sourceName, userId },
        isConnected: false,
        isAuthenticated: false,
        lastUsed: new Date()
      };

      ws.on('open', () => {
        console.log(`OBS WebSocket opened: ${connectionId}`);
      });

      ws.on('message', async (data) => {
        try {
          const msg = JSON.parse(data.toString());

          if (msg.op === 0) {
            // Authentication challenge
            const challenge = msg.d.authentication.challenge;
            const salt = msg.d.authentication.salt;
            const secret = await this.hashSHA256(password + salt);
            const auth = await this.hashSHA256(secret + challenge);

            ws.send(JSON.stringify({
              op: 1,
              d: { rpcVersion: 1, authentication: auth }
            }));
          }

          if (msg.op === 2) {
            // Authentication successful
            isAuthenticated = true;
            isConnected = true;
            connection.isConnected = true;
            connection.isAuthenticated = true;
            connection.lastUsed = new Date();
            
            this.connections.set(connectionId, connection);
            console.log(`OBS authenticated: ${connectionId}`);
            resolve(connection);
          }

          if (msg.op === 7) {
            // Request response
            if (msg.d.requestStatus.code === 100) {
              console.log(`OBS request successful: ${msg.d.requestType}`);
            } else {
              console.error(`OBS request failed: ${msg.d.requestStatus.code} - ${msg.d.requestStatus.comment}`);
            }
          }
        } catch (error) {
          console.error('Error processing OBS message:', error);
        }
      });

      ws.on('error', (error) => {
        console.error(`OBS WebSocket error: ${connectionId}`, error);
        reject(error);
      });

      ws.on('close', () => {
        console.log(`OBS WebSocket closed: ${connectionId}`);
        isConnected = false;
        isAuthenticated = false;
        connection.isConnected = false;
        connection.isAuthenticated = false;
        this.connections.delete(connectionId);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!isConnected) {
          ws.close();
          reject(new Error('OBS connection timeout'));
        }
      }, 10000);
    });
  }

  /**
   * Send verse to OBS
   * @param {string} connectionId - Connection ID (can be live connection ID or database connection ID)
   * @param {Object} verseData - Verse data to send
   * @returns {Promise<boolean>} Success status
   */
  async sendVerse(connectionId, verseData) {
    // First try to find by live connection ID
    let connection = this.connections.get(connectionId);
    
    // If not found, try to find by database connection ID
    if (!connection) {
      connection = this.getConnectionByDbId(connectionId);
    }
    
    if (!connection || !connection.isConnected) {
      throw new Error('OBS connection not available');
    }

    const { reference, text, version } = verseData;
    const formattedText = `${reference}: ${text}`;

    const payload = {
      op: 6,
      d: {
        requestType: "SetInputSettings",
        requestId: `setVerse_${Date.now()}`,
        requestData: {
          inputName: connection.config.sourceName,
          inputSettings: { text: formattedText }
        }
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('OBS request timeout'));
      }, 5000);

      const messageHandler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.op === 7 && msg.d.requestId === payload.d.requestId) {
            clearTimeout(timeout);
            connection.ws.removeListener('message', messageHandler);
            
            if (msg.d.requestStatus.code === 100) {
              connection.lastUsed = new Date();
              resolve(true);
            } else {
              reject(new Error(`OBS request failed: ${msg.d.requestStatus.comment}`));
            }
          }
        } catch (error) {
          console.error('Error processing OBS response:', error);
        }
      };

      connection.ws.on('message', messageHandler);
      connection.ws.send(JSON.stringify(payload));
    });
  }

  /**
   * Get OBS scene list
   * @param {string} connectionId - Connection ID
   * @returns {Promise<Array>} Scene list
   */
  async getScenes(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (!connection || !connection.isConnected) {
      throw new Error('OBS connection not available');
    }

    const payload = {
      op: 6,
      d: {
        requestType: "GetSceneList",
        requestId: `getScenes_${Date.now()}`
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('OBS request timeout'));
      }, 5000);

      const messageHandler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.op === 7 && msg.d.requestId === payload.d.requestId) {
            clearTimeout(timeout);
            connection.ws.removeListener('message', messageHandler);
            
            if (msg.d.requestStatus.code === 100) {
              resolve(msg.d.responseData.scenes);
            } else {
              reject(new Error(`OBS request failed: ${msg.d.requestStatus.comment}`));
            }
          }
        } catch (error) {
          console.error('Error processing OBS response:', error);
        }
      };

      connection.ws.on('message', messageHandler);
      connection.ws.send(JSON.stringify(payload));
    });
  }

  /**
   * Switch OBS scene
   * @param {string} connectionId - Connection ID
   * @param {string} sceneName - Scene name to switch to
   * @returns {Promise<boolean>} Success status
   */
  async switchScene(connectionId, sceneName) {
    const connection = this.connections.get(connectionId);
    
    if (!connection || !connection.isConnected) {
      throw new Error('OBS connection not available');
    }

    const payload = {
      op: 6,
      d: {
        requestType: "SetCurrentProgramScene",
        requestId: `switchScene_${Date.now()}`,
        requestData: {
          sceneName
        }
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('OBS request timeout'));
      }, 5000);

      const messageHandler = (data) => {
        try {
          const msg = JSON.parse(data.toString());
          if (msg.op === 7 && msg.d.requestId === payload.d.requestId) {
            clearTimeout(timeout);
            connection.ws.removeListener('message', messageHandler);
            
            if (msg.d.requestStatus.code === 100) {
              connection.lastUsed = new Date();
              resolve(true);
            } else {
              reject(new Error(`OBS request failed: ${msg.d.requestStatus.comment}`));
            }
          }
        } catch (error) {
          console.error('Error processing OBS response:', error);
        }
      };

      connection.ws.on('message', messageHandler);
      connection.ws.send(JSON.stringify(payload));
    });
  }

  /**
   * Get connection status
   * @param {string} connectionId - Connection ID
   * @returns {Object} Connection status
   */
  getConnectionStatus(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return { connected: false, authenticated: false };
    }

    return {
      connected: connection.isConnected,
      authenticated: connection.isAuthenticated,
      lastUsed: connection.lastUsed,
      config: {
        url: connection.config.url,
        sourceName: connection.config.sourceName
      }
    };
  }

  /**
   * Get all connections for a user
   * @param {string} userId - User ID
   * @returns {Array} User's connections
   */
  getUserConnections(userId) {
    const userConnections = [];
    
    for (const [id, connection] of this.connections) {
      if (connection.config.userId === userId) {
        userConnections.push({
          id,
          status: this.getConnectionStatus(id),
          config: connection.config
        });
      }
    }
    
    return userConnections;
  }

  /**
   * Find a live connection by database connection ID
   * @param {string} dbConnectionId - Database connection ID
   * @returns {Object|null} Live connection or null
   */
  getConnectionByDbId(dbConnectionId) {
    for (const [id, connection] of this.connections) {
      if (connection.dbConnectionId === dbConnectionId) {
        return connection;
      }
    }
    return null;
  }

  /**
   * Close a connection
   * @param {string} connectionId - Connection ID
   */
  closeConnection(connectionId) {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.ws.close();
      this.connections.delete(connectionId);
    }
  }

  /**
   * Close all connections for a user
   * @param {string} userId - User ID
   */
  closeUserConnections(userId) {
    for (const [id, connection] of this.connections) {
      if (connection.config.userId === userId) {
        connection.ws.close();
        this.connections.delete(id);
      }
    }
  }

  /**
   * Clean up inactive connections
   */
  cleanupInactiveConnections() {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [id, connection] of this.connections) {
      if (now - connection.lastUsed > inactiveThreshold) {
        console.log(`Cleaning up inactive OBS connection: ${id}`);
        connection.ws.close();
        this.connections.delete(id);
      }
    }
  }

  /**
   * Restore connections from database (for server restart)
   * @param {Array} savedConnections - Array of saved connections from database
   */
  async restoreConnections(savedConnections) {
    console.log(`Restoring ${savedConnections.length} OBS connections...`);
    
    for (const savedConn of savedConnections) {
      try {
        // Only restore active connections
        if (savedConn.isActive) {
          await this.createConnection({
            url: savedConn.url,
            password: savedConn.password,
            sourceName: savedConn.sourceName,
            userId: savedConn.userId,
            dbConnectionId: savedConn.id
          });
          console.log(`Restored OBS connection: ${savedConn.name}`);
        }
      } catch (error) {
        console.warn(`Failed to restore OBS connection ${savedConn.name}:`, error.message);
        // Continue with other connections even if one fails
      }
    }
  }
}

// Create singleton instance
const obsService = new ObsService();

// Clean up inactive connections every 10 minutes
setInterval(() => {
  obsService.cleanupInactiveConnections();
}, 10 * 60 * 1000);

module.exports = obsService;
