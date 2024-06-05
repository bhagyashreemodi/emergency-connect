import VolunteerTask from "../models/VolunteerTask.js";
import {CREATED, INTERNAL_SERVER_ERROR, NOT_FOUND, OK} from "../utils/HttpStatus.js";
import ResponseBody from "../models/ReponseBody.js";
import TaskMatcher from "../utils/TaskMatcher.js";
import Volunteer from "../models/Volunteer.js";

export default class VolunteerTaskManagementController {
    constructor() {
    }

    async retrieveVolunteerTasks(req, res) {
        let responseBody = new ResponseBody();
        responseBody.setSuccess(false);
        try {
            const {username} = req.params;
            const user = req.user;
            let tasks = await VolunteerTask.findVolunteerTasks(user.username);
            console.log(`returning tasks: ${tasks}`);
            return res
                .status(OK)
                .send(tasks);
        } catch (error) {
            console.error(error);
            responseBody.setMessage('Internal Server Error');
            responseBody.setSuccess(false);
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }
    }

    async retrieveAllOpenTasks(req, res) {
        console.log("Retrieving all open tasks");
        let responseBody = new ResponseBody();
        responseBody.setSuccess(false);
        try {
            const {status} = req.params;
            const user = req.user;
            const volunteer = await Volunteer.findVolunteerProfile(user.username);
            if (!volunteer) {
                console.log(`[Volunteer Task] Volunteer not found: ${user.username}`);
                responseBody.setMessage('Volunteer not found');
                return res.status(NOT_FOUND).send(responseBody);
            }
            let openAndNotDeclinedTasks = await VolunteerTask.getAllOpenUnDeclinedTasks(user.username, volunteer);
            return res
                .status(OK)
                .send(openAndNotDeclinedTasks);
        } catch (error) {
            console.error(error);
            responseBody.setMessage('Internal Server Error');
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }
    }

    async updateTaskStatus(req, res) {
        let responseBody = new ResponseBody();
        responseBody.setSuccess(false);
        try {
            const {username, taskName, status} = req.params;
            console.log(`Updating task status: ${taskName} to ${status}`);
            const user = req.user;
            let task = await VolunteerTask.findTaskByTitle(taskName);

            if (!task) {
                console.log(`[Volunteer Task] Task not found: ${taskName}`);
                responseBody.setMessage('Task not found');
                return res.status(NOT_FOUND).send(responseBody);
            }
            await task.updateTaskStatus(user.username,status);
            responseBody.setMessage('Task status updated successfully!');
            responseBody.setSuccess(true);
            return res
                .status(OK)
                .send(responseBody);
        } catch (error) {
            console.error(error);
            responseBody.setMessage('Internal Server Error');
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }
    }

    async createTask(req, res) {
        let responseBody = new ResponseBody();
        responseBody.setSuccess(false);
        try {
            const {title, helpMessage, fullAddress, city, state, zipCode, skill} = req.body;
            let existingTask = await VolunteerTask.findTaskByTitle(title);
            if (existingTask == null) {
                let task = new VolunteerTask(null, title, helpMessage, fullAddress, city, state,
                    zipCode, 'OPEN', null, [],skill);
                await task.saveVolunteerTask();
                responseBody.setMessage('Task created successfully!');
                responseBody.setSuccess(true);
                await TaskMatcher.matchTasksWithVolunteers(task);
            }
            return res.status(CREATED).send(responseBody);
        } catch (error) {
            console.error(error);
            responseBody.setMessage('Internal Server Error');
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }
    }

}