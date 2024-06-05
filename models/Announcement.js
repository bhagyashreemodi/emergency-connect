import User from "./User.js";
import DAO from "../db/DAO.js";

export default class Announcement {
    constructor() {
        this.sender = new User();
        this.timestamp = new Date();
        this.content = '';
    }

    setAllFields(obj) {
        this.sender = (obj.sender) ? obj.sender : new User();
        this.timestamp = (obj.timestamp) ? obj.timestamp : new Date();
        this.content = (obj.content) ? obj.content : '';
        return this;
    }

    toResJson() {
        return {
            username: this.sender.username,
            message: this.content,
            timestamp: this.timestamp
        };
    }

    static async getAllAnnouncements() {
        return await DAO.db.getAllAnnouncements();
    }

    static async retrieveAllAnnouncements() {
        const messages = await DAO.db.getAllAnnouncements();
        return messages
            .filter(message => message.sender.isActive) // filter out announcements from inactive user
            .map(message => message.toResJson());
    }

    async save() {
        await DAO.db.saveAnnouncement(this);
    }
}