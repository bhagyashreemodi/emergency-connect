import { Router } from 'express';
import AuthController from '../controllers/AuthController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const authRouter = Router();
const authController = new AuthController();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Join Community
 *     description: Creates a new account for the citizen
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid request
 */
authRouter.post('/users', authController.register);

/**
 * @swagger
 * /users/{username}/online:
 *   put:
 *     summary: Login
 *     description: Logs in the user
 *     parameters:
 *       - in: path
 *         name: username
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       404:
 *         description: User not found
 */
authRouter.put('/users/:username/online', authController.login);

/**
 * @swagger
 * /users/{username}/offline:
 *   put:
 *     summary: Logout
 *     description: Logs out the user
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       404:
 *         description: User not found
 */
authRouter.put('/users/:username/offline', authController.logout);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get All Users
 *     description: Get all users
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       status:
 *                         type: string
 *                       isOnline:
 *                         type: string
 *                       unread:
 *                         type: string
 *
 */
authRouter.get('/users', AuthMiddleware.isAccessGranted, authController.getAllUsers);

/**
 * @swagger
 * /users/{username}:
 *   get:
 *     summary: Get User
 *     description: Get user details by username
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *               user:
 *                type: object
 *       404:
 *         description: User not found
 */
authRouter.get('/users/:username', AuthMiddleware.isAccessGranted, authController.getUser);

/**
 * @swagger
 * /users/{username}/agree:
 *  put:
 *   summary: Agree to Terms
 *  description: Agree to the community rules
 * parameters:
 *  - in: path
 *    name: username
 *    required: true
 *    schema:
 *     type: string
 * responses:
 *       200:
 *         description: User logged out successfully
 *       500:
 *         description: Internal Server Error
 */
authRouter.put('/users/:username/agree', authController.agreeToTerms);

export default authRouter;
