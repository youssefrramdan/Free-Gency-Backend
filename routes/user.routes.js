import express from 'express';
import {
  createUser,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  uploadUserImage,
} from '../controllers/user.controller.js';
import {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  getMeValidator,
} from '../utils/validators/userValidator.js';
import { protectedRoutes } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const userRouter = express.Router();
const upload = createUploader("usersImages");
userRouter.route('/').post(createUserValidator, createUser).get(getAllUsers);
userRouter
  .route('/me')
  .get(protectedRoutes, getMeValidator, getMe)
  .put(protectedRoutes, updateMeValidator, updateMe);
userRouter.route('/my-image').put(
  protectedRoutes,
  upload.single('profileImage'),
  uploadUserImage
);
userRouter
  .route('/:id')
  .get(getUserValidator, getUser)
  .put(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

export default userRouter;
