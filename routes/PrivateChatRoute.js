import router from 'express';
import PrivateChatController from "../controllers/PrivateChatController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const privateChatRouter = router();
const privateChatController = new PrivateChatController();

/**
 * @swagger
 * /messages/private:
 *   post:
 *     summary: Send message privately
 *     description: Sends a message to another citizen privately
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipientUsername:
 *                 type: string
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
privateChatRouter.post('/messages/private', AuthMiddleware.isAccessGranted, privateChatController.sendMessagePrivately);

/**
 * @swagger
 * /messages/private/{username1}/{username2}:
 *   get:
 *     summary: Get messages sent privately between two users
 *     description: Get all the messages sent privately between two citizens
 *     parameters:
 *       - in: path
 *         name: username1
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: username2
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
 *                     senderUsername:
 *                       type: string
 *                     receiverUsername:
 *                       type: string
 *                     messageContent:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     senderStatus:
 *                       type: string
 *                     receiverStatus:
 *                       type: string
 *       404:
 *         description: User not found
 */
privateChatRouter.get('/messages/private/:username1/:username2', AuthMiddleware.isAccessGranted, privateChatController.getPrivateMessagesBetweenUsers);

/**
 * @swagger
 * /messages/private/{username}:
 *  get:
 *    summary: Get messages sent privately by user to all other users
 *    description: Get all the messages sent by a user privately to all other citizens
 *    parameters:
 *      - in: path
 *        name: username
 *        required: true
 *        schema:
 *          type: string
 *    responses:
 *      200:
 *        description: Messages retrieved successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  senderUsername:
 *                    type: string
 *                  receiverUsername:
 *                    type: string
 *                  messageContent:
 *                    type: string
 *                  timestamp:
 *                    type: string
 *                  senderStatus:
 *                    type: string
 *                  receiverStatus:
 *                    type: string
 *      404:
 *        description: User not found
 *
 */
privateChatRouter.get('/messages/private/:username', AuthMiddleware.isAccessGranted, privateChatController.getAllPrivateMessagesByUser);

/**
 * @swagger
 * /messages/private/{username}/read:
 *   put:
 *     summary: Update read status of messages
 *     description: Updates the read status of messages sent by a user to another citizen
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages updated successfully
 *       404:
 *         description: User not found
 *       500:
 *          description: Internal Server Error
 */
privateChatRouter.put('/messages/private/:username/read', AuthMiddleware.isAccessGranted, privateChatController.markMessagesRead);

export default privateChatRouter;