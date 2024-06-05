import router from 'express';
import VolunteerTasksManagementController from '../controllers/VolunteerTaskManagementController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const volunteerTasksManagementRouter = router();

const volunteerTasksManagementController = new VolunteerTasksManagementController();

/**
 * @swagger
 * /volunteers/{username}/tasks:
 *   get:
 *     summary: Retrieve Tasks assigned to Volunteer
 *     description: Retrieves tasks assigned to a volunteer
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Volunteer tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 city:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 state:
 *                   type: string
 *                 skill:
 *                   type: string
 *                 fullAddress:
 *                   type: string
 *                 helpMessage:
 *                   type: string
 *       404:
 *         description: Volunteer not found
 */
volunteerTasksManagementRouter.get('/volunteers/:username/tasks', AuthMiddleware.isAccessGranted,volunteerTasksManagementController.retrieveVolunteerTasks);

/**
 * @swagger
 * /volunteers/{username}/tasks/{taskName}/{status}:
 *   put:
 *     summary: Update Volunteer Task as accepted or declined by the volunteer.
 *     description: Updates the task status of a volunteer as accepted or declined.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskName
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['accepted', 'declined']
 *     responses:
 *       200:
 *         description: Volunteer profile deleted successfully
 *       404:
 *         description: Volunteer not found
 */
volunteerTasksManagementRouter.put('/volunteers/:username/tasks/:taskName/:status', AuthMiddleware.isAccessGranted,volunteerTasksManagementController.updateTaskStatus);

/**
 * @swagger
 * /volunteers/tasks:
 *   post:
 *     summary: Create a new volunteer task
 *     description: Creates a new volunteer task after the citizen changes the status to emergency or help
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               helpMessage:
 *                 type: string
 *               fullAddress:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               skill:
 *                 type: string
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *     responses:
 *       201:
 *         description: Volunteer profile created successfully
 *       400:
 *         description: Bad Request - Missing/Invalid fields
 *       500:
 *         description: Internal Server Error
 */
volunteerTasksManagementRouter.post('/volunteers/tasks', AuthMiddleware.isAccessGranted,volunteerTasksManagementController.createTask);

/**
 * @swagger
 * /volunteers/tasks/{status}:
 *   get:
 *     summary: Retrieve All Tasks in the given status
 *     description: Retrieves all tasks in the given status
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All tasks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 city:
 *                   type: string
 *                 zipCode:
 *                   type: string
 *                 state:
 *                   type: string
 *                 skill:
 *                   type: string
 *                 fullAddress:
 *                   type: string
 *                 helpMessage:
 *                   type: string
 *       404:
 *         description: Volunteer not found
 */
volunteerTasksManagementRouter.get('/volunteers/tasks/:status',AuthMiddleware.isAccessGranted, volunteerTasksManagementController.retrieveAllOpenTasks);

export default volunteerTasksManagementRouter;