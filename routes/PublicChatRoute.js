import router from 'express';
import PublicChatController from '../controllers/PublicChatController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const publicChatRouter = router();
const publicChatController = new PublicChatController();

/**
 * @swagger
 * /messages/public:
 *   post:
 *     summary: Send message publicly
 *     description: Sends a message to all the citizens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageContent:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 */
publicChatRouter.post('/messages/public', AuthMiddleware.isAccessGranted, publicChatController.sendMessagePublicly);

/**
 * @swagger
 *  /messages/public:
 *      get:
 *          summary: Get all messages
 *          description: Get all the messages sent by the citizens
 *          responses:
 *              200:
 *                  description: Messages retrieved successfully
 *                  content:
 *                      application/json:
 *                          schema:
 *                              type: array
 *                              items:
 *                                  type: object
 *                                  properties:
 *                                      username:
 *                                          type: string
 *                                      messageContent:
 *                                          type: string
 *                                      timestamp:
 *                                          type: string
 *                                      status:
 *                                          type: string
 */
publicChatRouter.get('/messages/public', AuthMiddleware.isAccessGranted, publicChatController.getAllPublicMessages);

/**
 * @swagger
 * /messages/public/{username}:
 *   get:
 *     summary: Get messages sent publicly by user
 *     description: Get all the messages sent by a user
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                     username:
 *                       type: string
 *                     messageContent:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     status:
 *                       type: string
 *       404:
 *         description: User not found
 */
publicChatRouter.get('/messages/public/:username/', AuthMiddleware.isAccessGranted, publicChatController.getPublicMessagesByUser);

export default publicChatRouter;
