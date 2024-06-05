import User from "./User.js";
import Post from "./Post.js";
import DAO from "../db/DAO.js";

export default class PostMessage {
    constructor() {
        this.sender = new User();
        this.timestamp = new Date();
        this.content = '';
        this.status = 'Undefined';
        this.postId = null;
    }

    setAllFields(obj) {
        this.sender = (obj.sender) ? obj.sender : new User();
        this.timestamp = (obj.timestamp) ? obj.timestamp : new Date();
        this.content = (obj.content) ? obj.content : '';
        this.status = (obj.status) ? obj.status : 'Undefined';
        this.postId = (obj.postId) ? obj.postId : null;
        console.log('status:', this.status);
        return this;
    }

    toResJson() {
        return {
            username: this.sender.username,
            message: this.content,
            status: this.status,
            timestamp: this.timestamp,
            postId: this.postId
        };
    }

    async save() {
        await DAO.db.savePostMessage(this);
    }

    static async retrieveAllPostMessages(postId) {
        const postMessages = await DAO.db.getAllPostMessagesByPost(postId);
        return postMessages.map(postMessage => postMessage.toResJson());
    }

    static async deleteAllPostMessages(postId) {
        await DAO.db.deleteAllPostMessagesByPost(postId);
    }
}