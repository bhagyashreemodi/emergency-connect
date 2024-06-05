import ResourceRequestPost from "../models/ResourceRequestPost.js";
import {FORBIDDEN, NOT_FOUND, OK} from "../utils/HttpStatus.js";
import SocketioConfig from "../config/SocketioConfig.js";
import {sendNotificationOnOfferHelp} from "../utils/EmailUtil.js";

export default class ResourceSharingController {
    constructor() {
        // solve `this` becomes undefined in `createNewPost()` issue
        this.createNewPost = this.createNewPost.bind(this);
        this.updatePost = this.updatePost.bind(this);
        this.updatePostProvider = this.updatePostProvider.bind(this);
        this.deletePost = this.deletePost.bind(this);
    }

    #broadcastPost() {
        const io = SocketioConfig.getInstance().getIO();
        io.emit('resource-sharing-post', {message: "Update in ResourceRequestPost"});
    }

    async getAllPosts(req, res) {
        const posts = await ResourceRequestPost.getAllPosts();
        const postsJson = posts.map((post) => post.toResJson()).reverse();
        return res.status(OK).send(postsJson);
    }

    async getPostById(req, res) {
        const postId = req.params.postId;
        const post = await ResourceRequestPost.getPostById(postId);
        if (!post) {
            return res.status(NOT_FOUND).send({message: 'Post not found'});
        }
        return res.status(OK).send(post.toResJson());
    }

    async createNewPost(req, res) {
        const postData = req.body.formData;
        postData.sender = req.user;
        postData.requestedItems = postData.requestedItems.filter(str => str); // filter out empty string

        const post = new ResourceRequestPost();
        post.setAllFields(postData);
        await post.save();

        this.#broadcastPost();
        return res.status(OK).send({message: 'New post created successfully'});
    }

    async updatePost(req, res) {
        const postId = req.params.postId;
        const postData = req.body.formData;
        postData.sender = req.user;
        postData.requestedItems = postData.requestedItems.filter(str => str); // filter out empty string

        const post = await ResourceRequestPost.getPostById(postId);
        if (!post) {
            return res.status(NOT_FOUND).send({message: `Post (id: ${postId}) not found`});
        }
        if (post.sender.username !== req.user.username) {
            return res.status(FORBIDDEN).send({message: `Post (id: ${postId}) does not belong to User:${req.user.username}`});
        }
        postData._id = post._id;

        post.setAllFields(postData); // note: post.providers will be incorrect
        await post.update();         // note: post.providers will not be updated

        this.#broadcastPost();
        return res.status(OK).send({message: 'Post updated successfully'});
    }

    async updatePostProvider(req, res) {
        const postId = req.params.postId;
        const post = await ResourceRequestPost.getPostById(postId);
        if (!post) {
            return res.status(NOT_FOUND).send({message: 'Post not found'});
        }
        if (post.sender.username === req.user.username) {
            return res.status(FORBIDDEN).send({message: `cannot response to post (id: ${postId}) sent by oneself`});
        }
        await post.updateAddProvider(req.user);

        // send email notification (no matter if this user has offered help previously or not)
        // console.log(`[updatePostProvider] ${JSON.stringify(req.body.formData)}`);
        const formData = req.body.formData;
        // `skipEmailNotification` is used for integration test. Normally, this field should not exist (undefined)
        if (!formData.skipEmailNotification)
            sendNotificationOnOfferHelp(post.email, post.sender.username, req.user.username, post.title, formData.message, formData.email);
        else
            console.log('[ResourceSharingController] email notification skipped');

        this.#broadcastPost();
        return res.status(OK).send(post.toResJson());
    }

    async deletePost(req, res) {
        const postId = req.params.postId;
        const post = await ResourceRequestPost.getPostById(postId);
        if (!post) {
            return res.status(NOT_FOUND).send({message: 'Post not found'});
        }
        if (post.sender.username !== req.user.username) {
            return res.status(FORBIDDEN).send({message: `Post (id: ${postId}) does not belong to User:${req.user.username}`});
        }
        await post.delete();
        this.#broadcastPost();
        return res.status(OK).send(post.toResJson());
    }
}
