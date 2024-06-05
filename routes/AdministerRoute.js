import router from 'express';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";
import AdminController from '../controllers/AdminController.js';

const administerRouter = router();
const adminController = new AdminController();

/**
 * @swagger
 * /users/{username}:
 *   put:
 *     summary: This is used by an Administrator to update a user's record
 *     description: |
 *       Update one or more fields of a user's record. ALL parameters are optional.
 *       If you do NOT want to update a certain field, you can:
 *       (1) do not include this field in request body at all;
 *       (2) input the original value of this field (do not apply to password field);
 *       (3) input an empty string ('').
 *       In this way, this API can be used to update selected field(s) of a user record.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               privilege:
 *                 type: string
 *               isActive:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: user not exist
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal Server Error
 */
administerRouter.put('/users/:username', AuthMiddleware.isAdmin, adminController.updateUser);


export default administerRouter;