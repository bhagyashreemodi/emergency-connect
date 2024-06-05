import DAO from "../db/DAO.js";

export default class VolunteerTask {

    constructor(username, title, helpMessage, fullAddress, city, state, zipCode, status, timestamp, declinedBy, skill) {
        this.assignee = username;
        this.title = title;
        this.helpMessage = helpMessage;
        this.fullAddress = fullAddress;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.status = status;
        this.timestamp = timestamp || Date.now();
        this.declinedBy = declinedBy || [];
        this.skill = skill;
    }

    async saveVolunteerTask() {
        console.log("Saving volunteer task to database");
        await DAO.db.saveVolunteerTask(this);
    }

    static async findVolunteerTasks(username) {
        console.log("Retrieving volunteer tasks from database");
        return await DAO.db.getVolunteerTasks(username);
    }

    static async getAllOpenUnDeclinedTasks(username, volunteer) {
        console.log("Retrieving all open and un-declined tasks from database");
        return await DAO.db.getAllOpenUnDeclinedTasks(username, volunteer);
    }

    static async findVolunteerTask(username, title) {
        return await DAO.db.getVolunteerTask(title);
    }

    async updateTaskStatus(username, status) {
        console.log("Updating volunteer task status in database");
        this.status = status;
        if(status.toLowerCase() === 'declined') {
            this.assignee = '';
            this.declinedBy.push(username);
        }
        else {
            this.assignee = username;
        }

        await DAO.db.updateVolunteerTask(this);
    }

    static getVolunteerTaskObject(record) {
        return new VolunteerTask(
            (record.assignee) ? record.assignee : '',
            (record.title) ? record.title : '',
            (record.helpMessage) ? record.helpMessage : '',
            (record.fullAddress) ? record.fullAddress : '',
            (record.city) ? record.city : '',
            (record.state) ? record.state : '',
            (record.zipCode) ? record.zipCode : '',
            (record.status) ? record.status : '',
            (record.timestamp) ? record.timestamp : Date.now(),
            (record.declinedBy) ? record.declinedBy : [],
            (record.skill) ? record.skill : ''
        );
    }

    static async findTaskByTitle(title) {
        return await DAO.db.getVolunteerTaskByTitle(title);
    }
}