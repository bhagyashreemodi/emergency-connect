import router from 'express';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import ShelterPostController from '../controllers/ShelterPostController.js';
import { upload } from '../config/Multer.js';

const ShelterRouter = router();
const shelterPostController = new ShelterPostController();

/**
 * @swagger
 * /shelter:
 *   get:
 *     summary: Retrieve Available Shelter
 *     description: Retrieve the available shelter posts in the system.
 *     responses:
 *       200:
 *         description: Messages retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   messageContent:
 *                     type: string
 *                   timestamp:
 *                     type: string
 */
ShelterRouter.get('/shelters', AuthMiddleware.isAccessGranted, shelterPostController.retrieveShelterPosts);

/**
 * @swagger
 * /shelters:
 *   post:
 *     summary: Register a new emergency shelter
 *     description: Allows a Citizen to register their property as an emergency shelter.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Shelter registered successfully.
 *       500:
 *         description: Internal Server Error
 */
ShelterRouter.post('/shelters', AuthMiddleware.isAccessGranted, upload.single('photo'), shelterPostController.createShelterPost);

/**
 * @swagger
 * /shelters/{postId}:
 *   put:
 *     summary: Update emergency shelter details
 *     description: Allows a Citizen to update the details of their emergency shelter post.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShelterUpdate'
 *     responses:
 *       200:
 *         description: Shelter updated successfully.
 *       404:
 *         description: Shelter not found.
 *       500:
 *         description: Internal Server Error
 */
ShelterRouter.put('/shelters/:postId', AuthMiddleware.isAccessGranted, upload.single('photo'), shelterPostController.updateShelterPost);

/**
 * @swagger
 * /shelters/{postId}/message:
 *   post:
 *     summary: Send message to a shelter post
 *     description: Allows a Citizen to send a message to a shelter post.
 *     parameters:
 *       - in: path
 *         name: postId
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
 *               message:
 *                 type: string
 *                 description: The content of the message to be sent to the shelter provider.
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *       404:
 *         description: Shelter not found.
 *       500:
 *         description: Internal Server Error
 */
ShelterRouter.post('/shelters/:postId/message', AuthMiddleware.isAccessGranted, shelterPostController.sendMessageToPost);

/**
 * @swagger
 * /shelters/{postId}/message:
 *   post:
 *     summary: Retrieve message from a shelter post
 *     description: Allows a Citizen to retrieve message from a shelter post.
 *     parameters:
 *       - in: path
 *         name: postId
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
 *               message:
 *                 type: string
 *                 description: The content of the message to be sent to the shelter provider.
 *     responses:
 *       200:
 *         description: Message sent successfully.
 *       404:
 *         description: Shelter not found.
 *       500:
 *         description: Internal Server Error
 */
ShelterRouter.get('/shelters/:postId/message', AuthMiddleware.isAccessGranted, shelterPostController.retrievePostMessage);

/**
 * @swagger
 * /shelters/{postId}:
 *   delete:
 *     summary: Remove an emergency shelter
 *     description: Allows a Citizen to remove their property from the list of available emergency shelters.
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Shelter removed successfully.
 *       404:
 *         description: Shelter not found.
 *       500:
 *         description: Internal Server Error
 */
ShelterRouter.delete('/shelters/:postId', AuthMiddleware.isAccessGranted, shelterPostController.deleteShelterPost);

export default ShelterRouter;