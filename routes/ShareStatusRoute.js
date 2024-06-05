import router from 'express';
import ShareStatusController from '../controllers/ShareStatusController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const shareStatusRouter = router();
const shareStatusController = new ShareStatusController();

/**
 * @swagger
 * /users/{username}/status/{status}:
 *   put:
 *     summary: Update Status
 *     description: Updates the status of the citizen
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       404:
 *         description: User not found
 *       500:
 *          description: Internal Server Error
 */
shareStatusRouter.put('/users/:username/status/:status', AuthMiddleware.isAccessGranted, shareStatusController.updateStatus);

/**
 * @swagger
 * /users/{username}/status/:
 *   get:
 *     summary: Retrieve Status
 *     description: Retrieve the current status of the citizen
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
 *       500:
 *          description: Internal Server Error
 */
shareStatusRouter.get('/users/:username/status', AuthMiddleware.isAccessGranted, shareStatusController.retrieveStatus);

export default shareStatusRouter;