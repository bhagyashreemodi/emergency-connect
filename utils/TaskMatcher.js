import Volunteer from "../models/Volunteer.js";
import SMSSubscriber from "./SMSSubscriber.js";
import SocketioConfig from "../config/SocketioConfig.js";

export default class TaskMatcher {

    static async matchTasksWithVolunteers(task) {
        try {
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            const volunteers = await Volunteer.getAvailableVolunteers(task.zipCode, task.city, task.state, today, task.skill);
            for (const volunteer of volunteers) {
                console.log(`Sending SMS to ${volunteer.firstName} at ${volunteer.phoneNumber} for task ${task.title}`);
                if(volunteer.consent === true) {
                    await SMSSubscriber.sendSMSNotification(volunteer.firstName, volunteer.phoneNumber, task);
                }
                TaskMatcher.sendIOEvent(task, volunteer)
            }
        } catch (error) {
            console.error(error);
        }
    }

    static sendIOEvent(task, volunteer) {
        try {
            const socketioConfig = SocketioConfig.getInstance();
            const assigneeSocketIds = socketioConfig.getSocketIdsByUsername(volunteer.username);
            if(assigneeSocketIds.length === 0) return;
            const io = socketioConfig.getIO();
            assigneeSocketIds.forEach(socketId => {
                io.to(socketId).emit('new-task-created', task);
            });
        } catch (error) {
            console.error(error);
        }
    }
}