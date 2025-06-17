import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';
import globalError from './middlewares/errorMiddleware.js';
import ApiError from './utils/apiError.js';
import userRouter from './routes/user.routes.js';
import authRouter from './routes/auth.routes.js';
import categoryRouter from './routes/category.routes.js';
import servicesRouter from './routes/services.routes.js';
import teamRouter from './routes/team.routes.js';
import taskRouter from './routes/task.routes.js';
import projectsRouter from './routes/projects.routes.js';
import reviewRouter from './routes/review.routes.js';
import notificationRouter from './routes/notification.routes.js';
import jobRouter from './routes/job.routes.js';
import subtaskRouter from './routes/subtasks.routes.js';

dotenv.config({ path: './config/config.env' });

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

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

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Free Gency API Documentation',
  })
);

//mount Routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/services', servicesRouter);
app.use('/api/v1/teams', teamRouter);
app.use('/api/v1/tasks', taskRouter);
app.use('/api/v1/projects', projectsRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/subtasks', subtaskRouter);
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new ApiError(`Can't find ${req.originalUrl} on this server!`, 400));
});

// Global error
app.use(globalError);

export default app;
