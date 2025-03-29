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
  changeMyPassword,
} from '../controllers/user.controller.js';
import {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  getMeValidator,
  changeMyPasswordValidator,
} from '../utils/validators/userValidator.js';
import { protectedRoutes } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const userRouter = express.Router();
const upload = createUploader('usersImages');
userRouter.route('/').post(createUserValidator, createUser).get(getAllUsers);
userRouter
  .route('/me')
  .patch(protectedRoutes, getMeValidator, getMe)
  .patch(protectedRoutes, updateMeValidator, updateMe);
userRouter
  .route('/my-image')
  .patch(protectedRoutes, upload.single('profileImage'), uploadUserImage);
userRouter
  .route('/changePassword')
  .patch(protectedRoutes, changeMyPasswordValidator, changeMyPassword);
userRouter
  .route('/:id')
  .get(getUserValidator, getUser)
  .put(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

export default userRouter;
