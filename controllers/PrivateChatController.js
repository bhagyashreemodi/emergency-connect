import {BAD_REQUEST, INTERNAL_SERVER_ERROR, OK} from "../utils/HttpStatus.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import SocketioConfig from "../config/SocketioConfig.js";

export default class PrivateChatController {
    constructor() {
        console.log("PrivateChatController constructor called");
    }

    async sendMessagePrivately(req, res) {
        try {
            const {recipientUsername, messageContent} = req.body;
            if(!recipientUsername || !messageContent) {
                return res.status(BAD_REQUEST).send({message: "Invalid request body"});
            }
            const sender = req.user;
            const recipient = await User.findUser(recipientUsername);
            const newMessage = new Message();
            newMessage.setAllFields({
                sender: sender,
                receiver: recipient,
                content: messageContent,
                type: "private",
                status: sender.getStatus(),
                receiverStatus: recipient.getStatus()
            });
            await newMessage.save();
            
            const socketioConfig = SocketioConfig.getInstance();
            const recipientSocketIds = socketioConfig.getSocketIdsByUsername(recipientUsername);
            const senderSocketIds = socketioConfig.getSocketIdsByUsername(sender.username); // Assuming the sender's username is accessible here

            const io = socketioConfig.getIO();

            // Emit to the recipient
            recipientSocketIds.forEach(socketId => {
                io.to(socketId).emit('private-message', newMessage.toResJson());
            });

            // Also emit to the sender (if the sender is connected from multiple devices, this ensures all instances are updated)
            senderSocketIds.forEach(socketId => {
                io.to(socketId).emit('private-message', newMessage.toResJson());
            });

            console.log(`[PrivateChatController] Message sent to ${recipientUsername} and echoed back to sender.`);
            return res.status(OK).send({ message: "Message sent successfully" });

        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
        }
    }

    async getPrivateMessagesBetweenUsers(req, res) {
        try {
            const {username1, username2} = req.params;
            const user1 = await User.findUser(username1);
            const user2 = await User.findUser(username2);
            if(!user1 || !user2) {
                return res.status(BAD_REQUEST).send({message: "User not found"});
            }
            const messages = await Message.retrieveAllPrivateMessagesBetweenUsers(user1, user2);
            return res.status(OK).send(messages);
        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
        }
    }

    async getAllPrivateMessagesByUser(req, res) {
        try {
            const {username} = req.params;
            const user = await User.findUser(username);
            if(!user) {
                return res.status(BAD_REQUEST).send({message: "User not found"});
            }
            const messages = await Message.retrieveAllPrivateMessagesByUser(user);
            return res.status(OK).send(messages);
        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
        }
    }

    async markMessagesRead(req, res) {
        try {
            const { username } = req.params;
            if(!username) {
                return res.status(BAD_REQUEST).send({message: "Invalid request"});
            }
            const sender = await User.findUser(username);
            const receiver = req.user;  // receiver is current user
            await receiver.markMessagesFromUserRead(sender);
            return res.status(OK).send({message: 'success'});
        } catch (error) {
            console.error(error);
            res.status(INTERNAL_SERVER_ERROR).send("Internal Server Error");
        }
    }

}