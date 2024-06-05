import User from "../models/User.js";
import { NOT_FOUND, OK, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../utils/HttpStatus.js";
import ResponseBody from "../models/ReponseBody.js";
import SocketioConfig from "../config/SocketioConfig.js";
import Post from "../models/Post.js";
import PostMessage from "../models/PostMessage.js";
import { v2 as cloudinary } from 'cloudinary';

export default class ShelterPostController {

    constructor() { }

    async retrieveShelterPosts(req, res) {
        const posts = await Post.retrieveAllPosts();
        return res.status(OK).send(posts);
    }

    async createShelterPost(req, res) {
        let responseBody = new ResponseBody();

        // Ensure there's a file in the request
        if (!req.file) {
            return res.status(400).send("No file uploaded.");
        }

        // Attempt to upload the file to Cloudinary
        try {
            const user = await User.findUser(req.user.username);
            if (!user) {
                console.log(`[Shelter Post] User not found: ${req.user.username}`);
                responseBody.setMessage('User not found');
                console.log(responseBody);
                return res.status(NOT_FOUND).send(responseBody);
            }

            const result = await ShelterPostController.uploadFileToCloudinary(req.file.buffer);

            const newShelterPost = new Post();
            newShelterPost.setAllFields({
                sender: user,
                content: req.body.msg,
                imgUrl: result.secure_url
            });
            await newShelterPost.save();

            const io = SocketioConfig.getInstance().getIO();
            io.emit('shelter-post', newShelterPost.toResJson());
            ShelterPostController.shelterSuccessResponse(result, responseBody, req);
            console.log(responseBody);
            return res.status(OK).send(responseBody);
        } catch (error) {
            console.error('Server Error:', error);
            return res.status(INTERNAL_SERVER_ERROR).send('Error uploading to Cloudinary');
        }
    }

    static shelterSuccessResponse(result, responseBody, req) {
        responseBody.message = "Shelter post created successfully";
        responseBody.data = {
            postContent: req.body.msg,
            imgUrl: result.secure_url
        };
        responseBody.success = true;
    }

    async updateShelterPost(req, res) {
        let responseBody = new ResponseBody();
        console.log('Update Shelter Post');
        try {
            let post = await Post.findPostById(req.params.postId);
            if (!post) {
                return res.status(NOT_FOUND).send('Post not found');
            }
            if(post.sender.username !== req.user.username) {
                return res.status(UNAUTHORIZED).send('Unauthorized');
            }
            if (req.file) {
                let result = await ShelterPostController.uploadFileToCloudinary(req.file.buffer);
                post.imgUrl = result.secure_url;
                console.log("Called updateImgUrl");
                await post.updateImgUrl();
            }
            if(req.body.msg) {
                post.content = req.body.msg;
                console.log("Called updateContent");
                await post.updateContent();
            }
            console.log('Post:', post);
            const io = SocketioConfig.getInstance().getIO();
            io.emit('update-shelter-post', post.toResJson());
            responseBody.setMessage('Update Shelter Post');
            return res.status(OK).send(responseBody);
        } catch (error) {
            console.error('Server Error:', error);
            return res.status(INTERNAL_SERVER_ERROR).send('Error updating shelter post');
        }
    }

    async deleteShelterPost(req, res) {
        let responseBody = new ResponseBody();
        responseBody.setMessage('Delete Shelter Post');
        console.log('Delete Shelter Post');
        console.log(req.params);
        try {
            let post = await Post.findPostById(req.params.postId);
            if(!post) {
                return res.status(NOT_FOUND).send('Post not found');
            }
            if(post.sender.username !== req.user.username) {
                return res.status(UNAUTHORIZED).send('Unauthorized');
            }
            await PostMessage.deleteAllPostMessages(req.params.postId);
            await post.delete();
            const io = SocketioConfig.getInstance().getIO();
            io.emit('delete-shelter-post', { postId: req.params.postId });
            responseBody.setMessage('Shelter post deleted successfully');
            return res.status(OK).send(responseBody);
        } catch (error) {
            console.error('Server Error:', error);
            return res.status(INTERNAL_SERVER_ERROR).send('Error deleting shelter post');
        }
    }

    async sendMessageToPost(req, res) {
        console.log('Send Message To Post');
        let responseBody = new ResponseBody();
        try {
            const messageContent = req.body.messageContent;
            const postId = req.params.postId;
            if (!postId || !messageContent) {
                return res.status(400).send('Invalid request body');
            }
            let post = await Post.findPostById(postId);
            if (!post) {
                return res.status(NOT_FOUND).send('Post not found');
            }
            let user = await User.findUser(req.user.username);
            if (!user) {
                return res.status(NOT_FOUND).send('User not found');
            }
            console.log('User:', user.getStatus());
            let newMessage = new PostMessage();
            newMessage.setAllFields({
                sender: user,
                postId: post._id,
                status: user.getStatus(),
                content: messageContent
            });
            await newMessage.save();
            console.log('New Message:', newMessage.toResJson());
            const io = SocketioConfig.getInstance().getIO();
            io.emit('shelter-post-message', newMessage.toResJson());
            responseBody.setMessage('Message sent to post');
            return res.status(OK).send(responseBody);

        } catch (error) {
            console.error('Server Error:', error);
            return res.status(INTERNAL_SERVER_ERROR).send('Error sending message to post');
        }
    }

    async retrievePostMessage(req, res) {
        console.log('Retrieve Post Messages');
        try {
            let postId = req.params.postId;
            console.log('Post ID:', postId);
            let post = await Post.findPostById(postId);
            if (!post) {
                return res.status(NOT_FOUND).send('Post not found');
            }
            let postMessages = await PostMessage.retrieveAllPostMessages(postId);
            console.log('Post Messages:', postMessages);
            return res.status(OK).send(postMessages);
        } catch (error) {
            console.error('Server Error:', error);
            return res.status(INTERNAL_SERVER_ERROR).send('Error retrieving post messages');
        }
    }

    // Helper function to upload file to Cloudinary
    static uploadFileToCloudinary(fileBuffer) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            uploadStream.end(fileBuffer);
        });
    }
}