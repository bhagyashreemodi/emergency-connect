import User from "./User.js";
import DAO from "../db/DAO.js";

export default class Message {
    constructor() {
        this.sender = new User();
        this.receiver = null;
        this.timestamp = new Date();
        this.content = '';
        this.status = 'Undefined';
        this.isRead = false;
        this.type = 'public';
        this.receiverStatus = 'OK';
    }

    setAllFields(obj) {
        this.sender     = (obj.sender) ? obj.sender : new User();
        this.receiver   = (obj.receiver) ? obj.receiver : null;
        this.timestamp  = (obj.timestamp) ? obj.timestamp : new Date();
        this.content    = (obj.content) ? obj.content : '';
        this.status     = (obj.status) ? obj.status : 'Undefined';
        this.isRead     = (obj.isRead) ? obj.isRead : false;
        this.type       = (obj.type) ? obj.type : 'public';
        this.receiverStatus = (obj.receiverStatus) ? obj.receiverStatus : 'Undefined';
        return this;
    }

    toResJson() {
        return {
            username: this.sender.username,
            message: this.content,
            status: this.status,
            timestamp: this.timestamp,
            type: this.type,
            receiver: this.receiver ? this.receiver.username : '',
            receiverStatus: this.receiverStatus,
            isRead: this.isRead
        };
    }

    static async getAllPublicMessages() {
        return await DAO.db.getAllPublicMessages();
    }

    static async retrieveAllPublicMessages() {
        const messages = await DAO.db.getAllPublicMessages();
        return messages
            .filter(message => message.sender.isActive) // filter out messages from inactive user
            .map(message => message.toResJson());
    }

    static async retrieveAllPublicMessagesByUser(user) {
        const messages = await DAO.db.getAllPublicMessagesByUser(user);
        return messages.map(message => message.toResJson());
    }

    async save() {
        await DAO.db.saveMessage(this);
    }

    static async getAllPrivateMessagesBetweenUsers(user1, user2) {
        return await DAO.db.getAllPrivateMessagesBetweenUsers(user1, user2);
    }

    static async retrieveAllPrivateMessagesBetweenUsers(user1, user2) {
        const messages = await DAO.db.getAllPrivateMessagesBetweenUsers(user1, user2);
        return messages
            .filter(message => message.sender.isActive) // filter out messages from inactive sender
            .map(message => message.toResJson());
    }

    static async retrieveAllPrivateMessagesByUser(user) {
        const messages = await DAO.db.getAllPrivateMessagesByUser(user);
        return messages.map(message => message.toResJson());
    }
}