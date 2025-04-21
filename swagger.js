import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Free Gency API Documentation',
      version: '1.0.0',
      description: 'API documentation for Free Gency platform',
    },
    servers: [
      {
        url: 'https://free-gency-api-v1.onrender.com/api/v1',
        // url: 'https://free-gency-backend-003bbc67b812.herokuapp.com/api/v1',
        description: 'Production server',
      },
      {
        url: 'http://localhost:8000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Admin',
        description: 'Admin operations for managing users',
      },
      {
        name: 'Authentication',
        description: 'User authentication operations',
      },
      {
        name: 'Password Reset',
        description: 'Password reset operations',
      },
      {
        name: 'Logged User',
        description: 'Operations for logged-in user',
      },
      {
        name: 'Teams',
        description: 'Team management operations',
      },
      {
        name: 'Categories',
        description: 'Category management operations',
      },
      {
        name: 'Services',
        description: 'Service management operations',
      },
      {
        name: 'Categories/Services',
        description: 'Operations for services within categories',
      },
      {
        name: 'Projects',
        description: 'Project management operations',
      },
    ],
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
