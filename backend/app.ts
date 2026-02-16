/**
 * Akomi Backend - Main Application Entry Point
 * 
 * Production-ready Express server for the Akomi subscription renewal agent.
 * 
 * Run:
 *   npm run dev:backend    # Development with hot reload
 *   npm run start:backend  # Production
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configuration
import { serverConfig } from './config';

// Import middleware
import { requestLogger } from './middleware/logging';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import routes from './routes';

// Initialize database
import { initializeDatabase } from './models/database';

// Initialize BITE encryption
import { initializeBITE } from './services/biteService';

// Create Express app
const app = express();

// ============================================
// Middleware
// ============================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ============================================
// Routes
// ============================================

app.use('/api', routes);

// ============================================
// Error Handling
// ============================================

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// ============================================
// Server Startup
// ============================================

async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    initializeDatabase();
    
    // Initialize BITE encryption
    console.log('Initializing BITE encryption...');
    await initializeBITE();
    
    // Start server
    app.listen(serverConfig.port, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Akomi Backend Server                                ║
║                                                           ║
║   Server running on port ${serverConfig.port}                          ║
║   Environment: ${serverConfig.nodeEnv}                                ║
║   API: http://localhost:${serverConfig.port}/api                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
export { app };

// Start server if run directly
if (require.main === module) {
  startServer();
}

export default app;
