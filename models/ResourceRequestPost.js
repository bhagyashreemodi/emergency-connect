import User from "./User.js";
import DAO from "../db/DAO.js";

export default class ResourceRequestPost {
    constructor() {
        this._id = null;
        this.sender = new User();
        this.timestamp = new Date();
        this.title = '';
        this.requestedItems = []; // array of string
        this.description = '';
        this.address = '';
        this.email = '';
        this.providers = []; // array of User
    }

    setAllFields(obj) {
        this._id            = (obj._id) ? obj._id : null;
        this.sender         = (obj.sender) ? obj.sender : new User();
        this.timestamp      = (obj.timestamp) ? obj.timestamp : new Date();
        this.title          = (obj.title) ? obj.title : '';
        this.requestedItems = (obj.requestedItems) ? obj.requestedItems : [];
        this.description    = (obj.description) ? obj.description : '';
        this.address        = (obj.address) ? obj.address : '';
        this.email          = (obj.email) ? obj.email : '';
        this.providers      = (obj.provider) ? obj.provider : [];
        return this;
    }

    toResJson() {
        return {
            _id: this._id,
            username: this.sender.username,
            timestamp: this.timestamp,
            title: this.title,
            requestedItems: this.requestedItems,
            description: this.description,
            address: this.address,
            email: this.email,
            providers: this.providers.map(u => u.username),
        };
    }

    static async getAllPosts() {
        return await DAO.db.getAllResourceRequestPost();
    }

    static async getPostById(postId) {
        return await DAO.db.getResourceRequestPostById(postId);
    }

    async save() {
        await DAO.db.saveResourceRequestPost(this);
    }

    // do not update providers
    async update() {
        await DAO.db.updateResourceRequestPost(this);
    }

    // add a new provider
    async updateAddProvider(newProvider) {
        // check if already contains this provider
        let containProvider = false;
        for (const provider of this.providers) {
            if (provider.username === newProvider.username) {
                containProvider = true;
                break;
            }
        }
        if (containProvider)
            return;

        this.providers.push(newProvider);
        await DAO.db.updateResourceRequestPostProviders(this);
    }

    async delete() {
        await DAO.db.deleteResourceRequestPost(this);
    }
}
