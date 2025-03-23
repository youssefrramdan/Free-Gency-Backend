import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import globalError from './middlewares/errorMiddleware.js';

dotenv.config({ path: './config/config.env' });

const app = express();

const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(compression());

// middlewares
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log(`mode : ${process.env.NODE_ENV}`);
}

//mount Routes

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Free-Gency API' });
});


// Handle undefined routes
app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server!`);
  next(err.message  );
});

// Global error
app.use(globalError);

// Handle errors that occur within promises but weren't caught
process.on("unhandledRejection", (err) => {
    console.error(`unhandledRejection Error : ${err.name} | ${err.message}`);
    server.close(() => {
      console.error(`Shutting down ...`);
      process.exit(1);
    });
  });

  // What about errors that happen synchronously outside Express?
  // For example, if an error occurs before Express starts,
  //  it won't be caught by Express error handling middleware.
  process.on("uncaughtException", (err) => {
    console.error(`Uncaught Exception: ${err.name} | ${err.message}`);
    // Gracefully shutting down
    process.exit(1); // Exit immediately with failure code
  });



export default app;
