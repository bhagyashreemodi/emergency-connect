import router from 'express';
import AnnouncementController from '../controllers/AnnouncementController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const announcementRouter = router();
const announcementController = new AnnouncementController();

/**
 * @swagger
 * /announcements:
 *   get:
 *     summary: Retrieve Latest Announcements
 *     description: Retrieves the latest public announcements
 *     responses:
 *       200:
 *         description: A list of announcements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   message:
 *                     type: string
 *                   sender:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal Server Error
 */
announcementRouter.get('/announcements', AuthMiddleware.isAccessGranted, announcementController.retrieveAnnouncements);

/**
 * @swagger
 * /announcements:
 *   post:
 *     summary: Post Announcement
 *     description: Allows a Coordinator to post a new public announcement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The announcement message
 *               sender:
 *                 type: string
 *                 description: Name of the sender
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Bad Request - Missing/Invalid fields
 *       500:
 *         description: Internal Server Error
 */
announcementRouter.post('/announcements', AuthMiddleware.isCoordinatorOrAbove, announcementController.postAnnouncement);

export default announcementRouter;
