import router from 'express';
import VolunteerProfileController from '../controllers/VolunteerProfileController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const volunteerProfileRouter = router();
const volunteerProfileController = new VolunteerProfileController();

/**
 * @swagger
 * /volunteers/{username}:
 *   get:
 *     summary: Retrieve Volunteer Profile
 *     description: Retrieves the profile of a volunteer
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Volunteer profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 firstName:
 *                   type: string
 *                 lastName:
 *                   type: string
 *                 city:
 *                   type: string
 *                 state:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 availability:
 *                   type: string
 *       404:
 *         description: Volunteer not found
 */
volunteerProfileRouter.get('/volunteers/:username', AuthMiddleware.isAccessGranted, volunteerProfileController.retrieveVolunteerProfile);

/**
 * @swagger
 * /volunteers:
 *   post:
 *     summary: Register Volunteer Profile
 *     description: Allows a citizen to register their profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               availability:
 *                 type: string
 *               consent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Volunteer profile created successfully
 *       400:
 *         description: Bad Request - Missing/Invalid fields
 *       500:
 *         description: Internal Server Error
 */
volunteerProfileRouter.post('/volunteers', AuthMiddleware.isAccessGranted, volunteerProfileController.createVolunteerProfile);

/**
 * @swagger
 * /volunteers/{username}:
 *   delete:
 *     summary: Delete Volunteer Profile
 *     description: Deletes the profile of a volunteer
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Volunteer profile deleted successfully
 *       404:
 *         description: Volunteer not found
 */
volunteerProfileRouter.delete('/volunteers/:username', AuthMiddleware.isAccessGranted, volunteerProfileController.deleteVolunteerProfile);

/**
 * @swagger
 * /volunteers:
 *   put:
 *     summary: Update Volunteer Profile
 *     description: Allows a citizen to update their profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               skills:
 *                 type: array
 *               phoneNumber:
 *                 type: string
 *               availability:
 *                 type: string
 *               consent:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Volunteer profile updated successfully
 *       400:
 *         description: Bad Request - Missing/Invalid fields
 *       500:
 *         description: Internal Server Error
 */
volunteerProfileRouter.put('/volunteers/', AuthMiddleware.isAccessGranted, volunteerProfileController.updateVolunteerProfile);
export default volunteerProfileRouter;