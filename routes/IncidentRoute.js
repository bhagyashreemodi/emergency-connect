import router from 'express';
import IncidentController from '../controllers/IncidentController.js';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const incidentRouter = router();
const incidentController = new IncidentController();

/**
 * @swagger
 * /incidents:
 *   get:
 *     summary: Retrieve All Incidents
 *     description: Retrieves all incidents
 *     responses:
 *       200:
 *         description: A list of incidents
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   type:
 *                     type: string
 *                   description:
 *                     type: string
 *                   location:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 *                   reportedBy:
 *                     type: object
 *                     format: date-time
 *                   status:
 *                     type: string
 *                   severity:
 *                     type: integer
 *                   timestamp:
 *                     type: string
 *                     format: date-time
 *                   lastEditedBy:
 *                     type: object
 *       500:
 *         description: Internal Server Error
 */
incidentRouter.get('/incidents', AuthMiddleware.isAccessGranted, incidentController.getAllIncidents);

/**
 * @swagger
 * /incidents:
 *   post:
 *     summary: Create Incident
 *     description: Creates a new incident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *               reportedBy:
 *                 type: string
 *               status:
 *                 type: string
 *               severity:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       400:
 *         description: Bad Request - Missing/Invalid fields
 *       500:
 *         description: Internal Server Error
 */
incidentRouter.post('/incidents', AuthMiddleware.isAccessGranted, incidentController.createIncident);

/**
 * @swagger
 * /incidents/{id}:
 *   put:
 *     summary: Update Incident
 *     description: Updates an existing incident
 *     parameters:
 *       - in: path
 *         name: id
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
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               severity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Incident updated successfully
 *       400:
 *         description: Bad Request - Missing/Invalid fields
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Internal Server Error
 */
incidentRouter.put('/incidents/:_id', AuthMiddleware.isAccessGranted, incidentController.updateIncident);

/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     summary: Delete Incident
 *     description: Deletes an incident
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Incident deleted successfully
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Internal Server Error
 */
incidentRouter.delete('/incidents/:_id', AuthMiddleware.isAccessGranted, incidentController.deleteIncident);

export default incidentRouter;