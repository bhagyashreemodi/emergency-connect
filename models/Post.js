import User from "./User.js";
import DAO from "../db/DAO.js";

export default class Post {
    constructor() {
        this._id = null;
        this.sender = new User();
        this.timestamp = new Date();
        this.content = '';
        this.imgUrl = '';
    }

    setAllFields(obj) {
        this._id = (obj._id) ? obj._id : null;
        this.sender = (obj.sender) ? obj.sender : new User();
        this.timestamp = (obj.timestamp) ? obj.timestamp : new Date();
        this.content = (obj.content) ? obj.content : '';
        this.imgUrl = (obj.imgUrl) ? obj.imgUrl : '';
        return this;
    }

    toResJson() {
        return {
            postId: this._id,
            username: this.sender.username,
            message: this.content,
            timestamp: this.timestamp,
            imgUrl: this.imgUrl
        };
    }

    static async retrieveAllPosts() {
        const posts = await DAO.db.getAllPosts();
        return posts.map(post => post.toResJson());
    }

    async save() {
        await DAO.db.savePost(this);
    }

    static async findPostById(postId) {
        const post = await DAO.db.findPostById(postId);
        return post;
    }

    async updateContent() {
        await DAO.db.updatePostContent(this);
    }

    async updateImgUrl() {
        await DAO.db.updatePostImgUrl(this);
    }

    async delete() {
        await DAO.db.deletePost(this);
    }
}