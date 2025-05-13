import { check, param } from 'express-validator';
import validatorMiddleware from '../../middlewares/validatorMiddleware.js';
import Category from '../../models/category.model.js';
import Service from '../../models/service.model.js';
import Team from '../../models/team.model.js';

const createProjectValidator = [
  check('title').notEmpty().withMessage('Project title is required'),
  check('description')
    .notEmpty()
    .withMessage('Project description is required'),
  check('budget').notEmpty().withMessage('Project budget is required'),
  check('completionDate')
    .notEmpty()
    .withMessage('Project completion date is required')
    .isISO8601()
    .withMessage('Completion date must be a valid date'),
  check('technologies')
    .isArray({ min: 1 })
    .withMessage('Technologies must be an array with at least one item'),
  check('technologies.*')
    .isString()
    .withMessage('Each technology must be a string'),
  check('service')
    .notEmpty()
    .withMessage('Service is required')
    .isMongoId()
    .withMessage('Service must be a valid Mongo ID')
    .custom(async (val, { req }) => {
      try {
        // Get team and service in parallel using Promise.all
        const [team, service] = await Promise.all([
          Team.findById(req.user.createdTeam).select('category'),
          Service.findById(val).select('category'),
        ]);

        if (!service) {
          throw new Error('Service does not exist');
        }
        if (!team) {
          throw new Error('Team not found');
        }

        // Check if service belongs to the team's category
        if (service.category.toString() !== team.category.toString()) {
          throw new Error("Service does not belong to your team's category");
        }

        // Store team category in request for later use
        req.teamCategory = team.category;
        return true;
      } catch (error) {
        throw new Error(error.message);
      }
    }),
  validatorMiddleware,
];

const getProjectValidator = [
  param('projectId').isMongoId().withMessage('Invalid project ID format'),
  validatorMiddleware,
];

const updateProjectValidator = [
  param('projectId').isMongoId().withMessage('Invalid project ID format'),
  validatorMiddleware,
];

const deleteProjectValidator = [
  param('projectId').isMongoId().withMessage('Invalid project ID format'),
  validatorMiddleware,
];

const getTeamProjectsValidator = [
  param('teamId').isMongoId().withMessage('Invalid team ID format'),
  validatorMiddleware,
];

const getCategoryProjectsValidator = [
  param('categoryId').isMongoId().withMessage('Invalid category ID format'),
  validatorMiddleware,
];

const getServiceProjectsValidator = [
  param('serviceId').isMongoId().withMessage('Invalid service ID format'),
  validatorMiddleware,
];

export {
  createProjectValidator,
  getProjectValidator,
  updateProjectValidator,
  deleteProjectValidator,
  getTeamProjectsValidator,
  getCategoryProjectsValidator,
  getServiceProjectsValidator,
};
