import asyncHandler from 'express-async-handler';
import ApiError from '../utils/apiError.js';
import Project from '../models/project.model.js';

const createProject = asyncHandler(async (req, res, next) => {
  const project = new Project({
    title: req.body.title,
    description: req.body.description,
    requiredSkills : req.body.requiredSkills,
    category :req.body.category,
    service :req.body.service,
    budget: req.body.budget,
    deadline: req.body.deadline,
    client: req.user._id,
    projectDetails :
  })
  await project.save();
  res.status(200).json({
    message: 'success',
    data: project,
  });
});

export { createProject };
