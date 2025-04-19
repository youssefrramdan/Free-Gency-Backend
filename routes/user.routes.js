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
  changeUserPassword,
} from '../controllers/user.controller.js';
import {
  createUserValidator,
  getUserValidator,
  updateUserValidator,
  deleteUserValidator,
  updateMeValidator,
  getMeValidator,
  changeMyPasswordValidator,
  changeUserPasswordValidator,
} from '../utils/validators/userValidator.js';
import { protectedRoutes } from '../controllers/auth.controller.js';
import createUploader from '../middlewares/cloudnairyMiddleware.js';

const userRouter = express.Router();
const upload = createUploader('usersImages');

/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: Admin operations for managing users
 *   - name: Logged User
 *     description: Operations for logged-in user
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Admin]
 *     summary: Get all users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *   post:
 *     tags: [Admin]
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [client, team_leader, admin]
 *     responses:
 *       201:
 *         description: User created successfully
 */
userRouter.route('/').post(createUserValidator, createUser).get(getAllUsers);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags: [Logged User]
 *     summary: Get current user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *   patch:
 *     tags: [Logged User]
 *     summary: Update current user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               bio:
 *                 type: string
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
userRouter
  .route('/me')
  .get(protectedRoutes, getMeValidator, getMe)
  .patch(protectedRoutes, updateMeValidator, updateMe);

/**
 * @swagger
 * /users/my-image:
 *   patch:
 *     tags: [Logged User]
 *     summary: Upload user profile image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profileImage
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
 */
userRouter
  .route('/my-image')
  .patch(protectedRoutes, upload.single('profileImage'), uploadUserImage);

/**
 * @swagger
 * /users/changePassword:
 *   patch:
 *     tags: [Logged User]
 *     summary: Change current user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - password
 *               - passwordConfirm
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               password:
 *                 type: string
 *                 format: password
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
userRouter
  .route('/changePassword')
  .patch(protectedRoutes, changeMyPasswordValidator, changeMyPassword);

/**
 * @swagger
 * /users/changePassword/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Change user password (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - passwordConfirm
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
userRouter
  .route('/changePassword/:id')
  .patch(protectedRoutes, changeUserPasswordValidator, changeUserPassword);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Admin]
 *     summary: Get a specific user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *   put:
 *     tags: [Admin]
 *     summary: Update a specific user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [client, team_leader, admin]
 *     responses:
 *       200:
 *         description: User updated successfully
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a specific user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 */
userRouter
  .route('/:id')
  .get(getUserValidator, getUser)
  .put(updateUserValidator, updateUser)
  .delete(deleteUserValidator, deleteUser);

export default userRouter;
