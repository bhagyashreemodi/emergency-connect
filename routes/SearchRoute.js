import router from 'express';
import SearchController from '../controllers/SearchController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const searchRouter = router();
const searchController = new SearchController();

/**
 * @swagger
 * /entities:
 *   get:
 *     summary: Search Information
 *     description: Allows the citizen to search for any information stored in the system based on the provided search keyword.
 *     parameters:
 *       - in: query
 *         name: context
 *         required: true
 *         description: The current screen or context of the application.
 *         schema:
 *           type: string
 *       - in: query
 *         name: keyword
 *         required: true
 *         description: The search keyword provided by the citizen.
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         required: false
 *         description: User status for user and chat message search.
 *         schema:
 *           type: string
 *       - in: query
 *         name: offset
 *         required: false
 *         description: Offset for pagination.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of items to return (for pagination).
 *         schema:
 *           type: integer
 *         default: 10
 *     responses:
 *       200:
 *         description: Search results matching the keyword and context.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       status:
 *                         type: string # can be array of objects, TODO: check w/ backend
 *                       timestamp:
 *                         type: string
 *                       message:
 *                         type: string
 *                       isOnline:
 *                         type: boolean
 *                       senderUsername:  
 *                           type: string
 *                       receiverUsername: 
 *                           type: string
 *                       senderStatus: 
 *                           type: string
 *                       receiverStatus:
 *                           type: string 
 *                       messageStatus:
 *                           type: string
 *                 context:
 *                   type: string
 *                   description: The type of the search result (e.g., "user", "message", "announcement").
 *                 totalResults:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       404:
 *         description: No matches found.
 *       500:
 *         description: Internal Server Error
 */
searchRouter.get('/entities', AuthMiddleware.isAccessGranted, searchController.performSearch);

export default searchRouter;
