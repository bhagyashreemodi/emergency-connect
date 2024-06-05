import User from "../models/User.js";
import { NOT_FOUND, OK, INTERNAL_SERVER_ERROR } from "../utils/HttpStatus.js";
import ResponseBody from "../models/ReponseBody.js";
import SocketioConfig from "../config/SocketioConfig.js";
export default class ShareStatusController {

    constructor() { }

    async retrieveStatus(req, res) {
        const username = req.params.username?.trim().toLowerCase();    // case-insensitive
        console.log(`[Share Status] username: ${username}`);

        try {
            const { username, status } = req.params;
            let responseBody = new ResponseBody();
            const user = await User.findUser(username);
            if (!user) {
                console.log(`[Share Status] User not found: ${username}`);
                responseBody.setMessage('User not found');
                console.log(responseBody);
                return res.status(NOT_FOUND).send(responseBody);
            }
            responseBody.setMessage('Status retrieved successfully!');
            responseBody.setSuccess(true);
            responseBody.setUser(user);
            return res
                .status(OK)
                .send(responseBody);
        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
        }
    }

    async updateStatus(req, res) {
        const username = req.params.username?.trim().toLowerCase();    // case-insensitive
        console.log(`[Share Status] username: ${username}`);

        try {
            const { username, status } = req.params;
            let responseBody = new ResponseBody();
            const user = await User.findUser(username);
            if (!user) {
                console.log(`[Share Status] User not found: ${username}`);
                responseBody.setMessage('User not found');
                console.log(responseBody);
                return res.status(NOT_FOUND).send(responseBody);
            }
            await user.setUserStatus(status);
            const io = SocketioConfig.getInstance().getIO();
            io.emit('user-update-status');
            responseBody.setMessage('Status updated successfully!');
            responseBody.setSuccess(true);
            return res
                .status(OK)
                .send(responseBody);
        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
        }
    }
}