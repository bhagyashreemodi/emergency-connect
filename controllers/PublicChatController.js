import SocketioConfig from "../config/SocketioConfig.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { BAD_REQUEST, NOT_FOUND, OK } from "../utils/HttpStatus.js";
import ESNSpeedTestConfig from "../config/ESNSpeedTestConfig.js";

export default class PublicChatController {
    constructor() {
        console.log("PublicChatController constructor called");
    }

    async sendMessagePublicly(req, res) {
        const messageContent = req.body.messageContent;
        if (!messageContent) {
            return res.status(BAD_REQUEST).send({message: 'Message content is empty'});
        }
        const user = await User.findUser(req.user.username);   
        if (!user) {
            console.log(`[Share Status] User not found: ${req.user.username}`);
            return res.status(NOT_FOUND).send({message: 'User not found'});
        }
        const newMessage = new Message();
        newMessage.setAllFields({
            sender: user,
            content: messageContent,
            status: user.status,
        });
        await newMessage.save();
        PublicChatController.emitEvent(newMessage);
        return res.status(OK).send({message: 'Message sent successfully'});
    }

    static emitEvent(newMessage) {
        let esnSpeedTest  = ESNSpeedTestConfig.getInstance();
        if(!esnSpeedTest.isSpeedTestStarted()) {
            const io = SocketioConfig.getInstance().getIO();
            io.emit('public-message', newMessage.toResJson());
        }
    }

    async getAllPublicMessages(req, res) {
        console.log("[Get All Public Messages]");
        const messages = await Message.retrieveAllPublicMessages();
        return res.status(OK).send(messages);
    }

    async getPublicMessagesByUser(req, res) {
        const user = await User.findUser(req.params.username);
        if (!user)
            return res.status(NOT_FOUND).send({message: 'User not found'});
        const messages = await Message.retrieveAllPublicMessagesByUser(user);
        return res.status(OK).send(messages);
    }
}