import SocketioConfig from "../config/SocketioConfig.js";
import User from "../models/User.js";
import Announcement from "../models/Announcement.js";
import ResponseBody from "../models/ReponseBody.js";
import { BAD_REQUEST, NOT_FOUND, OK } from "../utils/HttpStatus.js";

export default class AnnouncementController {
    constructor() {
        console.log("AnnouncementController constructor called");
    }

    async retrieveAnnouncements(req, res) {
        const announcements = await Announcement.retrieveAllAnnouncements();
        return res.status(OK).send(announcements);
    }

    async postAnnouncement(req, res) {
        const announcementContent = req.body.announcementContent;
        let responseBody = new ResponseBody();
        if (!announcementContent) {
            return res.status(BAD_REQUEST).send({ message: 'Announcement content is empty' });
        }
        const user = await User.findUser(req.user.username);
        if (!user) {
            console.log(`[Post Announcement] User not found: ${req.user.username}`);
            responseBody.setMessage('User not found');
            console.log(responseBody);
            return res.status(NOT_FOUND).send(responseBody);
        }
        // TODO: Check is coordinator
        const newAnnouncement = new Announcement();
        newAnnouncement.setAllFields({
            sender: user,
            content: announcementContent
        });
        await newAnnouncement.save();

        const io = SocketioConfig.getInstance().getIO();
        io.emit('post-announcement', newAnnouncement.toResJson());
        return res.status(OK).send({ message: 'Announcement post successfully' });
    }
}