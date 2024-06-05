import router from 'express';
import ResourceSharingController from "../controllers/ResourceSharingController.js";
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const resourceSharingRouter = router();
const resourceSharingController = new ResourceSharingController();

/**
 * @swagger
 * /resource-requests:
 *   get:
 *     summary: Retrieve All Resource-Request Posts
 *     description: Retrieve All Resource-request posts in the system.
 *     responses:
 *       200:
 *         description: Posts retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   requestedItems:
 *                     type: array
 *                     items:
 *                       type: string
 *                   timestamp:
 *                     type: string
 *                   description:
 *                     type: string
 *                   address:
 *                     type: string
 *                   email:
 *                     type: string
 *       403:
 *         description: Forbidden to fetch posts
 */
resourceSharingRouter.get('/resource-requests', AuthMiddleware.isAccessGranted, resourceSharingController.getAllPosts);

/**
 * @swagger
 * /resource-requests:
 *   get:
 *     summary: Retrieve Resource-Request Post By ID
 *     description: Retrieve Resource-Request Post By ID.
 *     responses:
 *       200:
 *         description: Posts retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   requestedItems:
 *                     type: array
 *                     items:
 *                       type: string
 *                   timestamp:
 *                     type: string
 *                   description:
 *                     type: string
 *                   address:
 *                     type: string
 *                   email:
 *                     type: string
 *       403:
 *         description: Forbidden to fetch posts
 *       404:
 *         description: Post not found
 */
resourceSharingRouter.get('/resource-requests/:postId', AuthMiddleware.isAccessGranted, resourceSharingController.getPostById);

/**
 * @swagger
 * /resource-requests:
 *   post:
 *     summary: Post a New Resource Request
 *     description: Allows a Citizen to post a new resource request publicly.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               requestedItems:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: New resource request posted successfully.
 *       500:
 *         description: Internal Server Error
 */
resourceSharingRouter.post('/resource-requests', AuthMiddleware.isAccessGranted, resourceSharingController.createNewPost);

/**
 * @swagger
 * /resource-requests/{postId}:
 *   put:
 *     summary: Update an Existing Resource Request Post
 *     description: Allows a Citizen to Update an existing resource request post.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               requestedItems:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 *       403:
 *         description: Current citizen is not allowed to update this post
 *       500:
 *         description: Internal Server Error
 */
resourceSharingRouter.put('/resource-requests/:postId', AuthMiddleware.isAccessGranted, resourceSharingController.updatePost);

/**
 * @swagger
 * /resource-requests/{postId}/taken:
 *   put:
 *     summary: Mark a Request Taken.
 *     description: Mark a request post taken by another citizen
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       404:
 *         description: Post not found
 *       403:
 *         description: Current citizen is not allowed to update this post
 *       500:
 *         description: Internal Server Error
 */
resourceSharingRouter.put('/resource-requests/:postId/provider', AuthMiddleware.isAccessGranted, resourceSharingController.updatePostProvider);

/**
 * @swagger
 * /resource-requests/{postId}:
 *   delete:
 *     summary: Delete a Resource-Request Post
 *     description: Allow a citizen to delete a resource-request post.
 *     requestBody:
 *       required: false
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       404:
 *         description: Post not found
 *       403:
 *         description: Current citizen is not allowed to delete this post
 *       500:
 *         description: Internal Server Error
 */
resourceSharingRouter.delete('/resource-requests/:postId', AuthMiddleware.isAccessGranted, resourceSharingController.deletePost);


export default resourceSharingRouter;
