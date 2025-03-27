import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import globalError from './middlewares/errorMiddleware.js';
import ApiError from './utils/apiError.js';
import teamLeaderRouter from './routes/teamLeader.routes.js';

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
app.use('/api/v1/team-leaders', teamLeaderRouter);
// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 400));
});

// Global error
app.use(globalError);

export default app;
