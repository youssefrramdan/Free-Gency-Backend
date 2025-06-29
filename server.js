import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import databaseConnection from './config/dbConnection.js';
import initializeSocket from './service/socketHandler.js';

databaseConnection();
const PORT = process.env.PORT || 8000;

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*', // In production, specify your Flutter app's origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialize socket handlers
initializeSocket(io);

// Make io accessible throughout the app
app.set('io', io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}....`);
  console.log(`Socket.IO server initialized`);
});

// Handle errors that occur within promises but weren't caught
process.on('unhandledRejection', err => {
  console.error(`unhandledRejection Error : ${err.name} | ${err.message}`);
  server.close(() => {
    console.error(`Shutting down ...`);
    process.exit(1);
  });
});

// Handle errors that happen synchronously outside Express
// For example, if an error occurs before Express starts,
//  it won't be caught by Express error handling middleware.

process.on('uncaughtException', err => {
  console.error(`Uncaught Exception: ${err.name} | ${err.message}`);
  process.exit(1);
});
