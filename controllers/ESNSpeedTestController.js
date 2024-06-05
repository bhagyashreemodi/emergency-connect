import ESNSpeedTestConfig from "../config/ESNSpeedTestConfig.js";
import ResponseBody from "../models/ReponseBody.js";
import {BAD_REQUEST, OK} from "../utils/HttpStatus.js";
import User from "../models/User.js";

export default class ESNSpeedTestController {
    constructor() {
    }

    async startSpeedTest(req, res) {
        let responseBody = new ResponseBody();
        try {
            let config = ESNSpeedTestConfig.getInstance();
            if(config.isSpeedTestStarted()) {
                responseBody.setMessage("Speed test already started.");
                return res.status(BAD_REQUEST).send(responseBody);
            }
            await config.setupAndStartSpeedTest();
            const user = await User.findUser(req.user.username);
            if(!user) {
                await User.setupUserInTestDB(req.user);
            }
            responseBody.setMessage("Speed test started.");
            return res.status(OK).send(responseBody)
        } catch (error) {
            console.error("Error starting speed test:", error);
            responseBody.setMessage(error.message);
            responseBody.setSuccess(false);
            return res.status(BAD_REQUEST).send(responseBody);
        }
    }

    async stopSpeedTest(req, res) {
        let responseBody = new ResponseBody();
        console.log("Stopping speed test...");
        try {
            let config = ESNSpeedTestConfig.getInstance();
            if(!config.isSpeedTestStarted()) {
                responseBody.setMessage("Speed test not started.");
                return res.status(OK).send(responseBody);
            }
            await config.stopSpeedTest();
            responseBody.setMessage("Speed test stopped.");
            return res.status(OK).send(responseBody)
        } catch (error) {
            console.error("Error stopping speed test:", error);
            responseBody.setMessage(error.message);
            responseBody.setSuccess(false);
            return res.status(BAD_REQUEST).send(responseBody);
        }
    }
}