import express from 'express';
import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
} from '../utils/validators/userValidator.js';

const userRouter = express.Router();

userRouter.route('/').post(createUserValidator, createUser).get(getAllUsers);

userRouter
  .route('/:id')
  .get(getUserValidator, getUser)
  .put(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

export default userRouter;
