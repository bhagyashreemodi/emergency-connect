import mongoose, { Schema } from 'mongoose';
import User from "../models/User.js";
import Message from "../models/Message.js";
import Post from "../models/Post.js";
import PostMessage from '../models/PostMessage.js';
import Announcement from '../models/Announcement.js';
import Incident from '../models/Incident.js';
import ResourceRequestPost from "../models/ResourceRequestPost.js";
import Volunteer from "../models/Volunteer.js";
import VolunteerTask from "../models/VolunteerTask.js";
import DateTimeUtil from "../utils/DateTimeUtil.js";

/**
 * This class is a database implementation, the dependency of DAO.
 * DAO gets its dependency via dependency injection: `DAO.db = new MongoDBImpl()`
 *
 * All database implementations must implement all `IDatabase` operations.
 * However, here in JavaScript, we do not specify `IDatabase` explicitly.
 * Just make sure all database implementations implements exactly same methods with exactly same signatures.
 */
export default class MongoDBImpl {
    constructor() {
        this.UserModel = null;
        this.MessageModel = null;
        this.AnnouncementModel = null;
        this.IncidentModel = null;
        this.ResourceRequestPostModel = null;
        this.VolunteerProfileModel = null;
        this.VolunteerTaskModel = null;

        this.createModels();
    }

    createModels() {
        // UserSchema
        const UserSchema = this.getUserSchema();
        this.UserModel = mongoose.model('User', UserSchema);

        // MessageSchema
        const MessageSchema = this.getMessageSchema();
        this.MessageModel = mongoose.model('Message', MessageSchema);

        // AnnouncementSchema
        const AnnouncementSchema = this.getAnnouncementSchema();
        this.AnnouncementModel = mongoose.model('Announcement', AnnouncementSchema);

        // PostSchema
        const PostSchema = this.getPostSchema();
        this.PostModel = mongoose.model('Post', PostSchema);

        // PostMessageSchema
        const PostMessageSchema = this.getPostMessageSchema();
        this.PostMessageModel = mongoose.model('PostMessage', PostMessageSchema);

        // IncidentSchema
        const IncidentSchema = this.getIncidentSchema();
        this.IncidentModel = mongoose.model('Incident', IncidentSchema);

        // ResourceRequestPostSchema
        const ResourceRequestPostSchema = this.getResourceRequestPostSchema();
        this.ResourceRequestPostModel = mongoose.model('ResourceRequestPost', ResourceRequestPostSchema);

        this.VolunteerProfileModel = mongoose.model('VolunteerProfile', this.getVolunteerProfileSchema());
        this.VolunteerTaskModel = mongoose.model('VolunteerTask', this.getVolunteerTaskSchema());

    }

    getResourceRequestPostSchema() {
        return new Schema({
            sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            timestamp: { type: Date, required: true, default: Date.now },
            title: { type: String, required: true },
            requestedItems: [{ type: String, required: true }],
            description: { type: String },
            address: { type: String },
            email: { type: String, required: true },
            providers: [{provider: {type: Schema.Types.ObjectId, ref: 'User', required: true}}],
        });
    }

    getUserSchema() {
        return new Schema({
            username: { type: String, unique: true, required: true },
            password: { type: String, required: true },
            isOnline: { type: Boolean, default: false },
            isAgree: { type: Boolean, default: false },
            isSharingStatus: { type: Boolean, default: false },
            status: { type: String, enum: ['OK', 'Help', 'Emergency', 'Undefined'], default: 'Undefined' },
            timestamp: { type: Date, default: Date.now },
            privilege: { type: String, enum: ['Citizen', 'Coordinator', 'Administrator'], default: 'Citizen' },
            isActive: { type: Boolean, default: true },
        });
    }


    getMessageSchema() {
        return new Schema({
            sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            timestamp: { type: Date, default: Date.now },
            content: { type: String, required: true },
            status: { type: String, enum: ['OK', 'Help', 'Emergency', 'Undefined'], default: 'Undefined' },
            receiver: { type: Schema.Types.ObjectId, ref: 'User' },
            isRead: { type: Boolean, default: false },
            type: { type: String, enum: ['public', 'private'], default: 'public' },
            receiverStatus: { type: String, enum: ['OK', 'Help', 'Emergency', 'Undefined'], default: 'Undefined' }
        });
    }

    getAnnouncementSchema() {
        return new Schema({
            sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            timestamp: { type: Date, default: Date.now },
            content: { type: String, required: true }
        });
    }

    getIncidentSchema() {
        return new Schema({
            type: { type: String, required: true },
            description: { type: String, required: true },
            location: {
                type: {
                    type: String,
                    enum: ['Point'],
                    required: true
                },
                coordinates: {
                    type: [Number],
                    required: true
                }
            },
            reportedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            timestamp: { type: Date, default: Date.now },
            status: { type: String, required: true },
            severity: { type: String, required: true },
            lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' }
        });
    }

    getPostSchema() {
        return new Schema({
            sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now },
            imgUrl: { type: String, default: '', required: true}
        });
    }

    getPostMessageSchema() {
        return new Schema({
            sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            timestamp: { type: Date, default: Date.now },
            content: { type: String, required: true },
            status: { type: String, enum: ['OK', 'Help', 'Emergency', 'Undefined'], default: 'Undefined' },
            postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true }
        });
    }


    /*
     * --------------------- User Operations ---------------------
     */
    async saveUser(user) {
        const newUserRecord = new this.UserModel({
            username: user.username,
            password: user.password,
            privilege: user.privilege,
            status: user.status,
        });
        await newUserRecord.save();
        user.setAllFields(newUserRecord);
        return user;
    }

    async updateUserById(user) {
        await this.UserModel.findByIdAndUpdate(user._id, {
            username: user.username,
            password: user.password,
            privilege: user.privilege,
            isActive: user.isActive,
        });
    }

    async getUser(username) {
        const userRecord = await this.UserModel.findOne({ username: username });
        return (userRecord) ? new User().setAllFields(userRecord) : null;
    }

    async getUserById(id) {
        const userRecord = await this.UserModel.findById(id);
        return (userRecord) ? new User().setAllFields(userRecord) : null;
    }

    async getAllUsers() {
        const userRecords = await this.UserModel.find().collation({locale: 'en', strength: 2});
        return userRecords.map(userRecord => new User().setAllFields(userRecord));
    }

    async updateUserOnlineStatus(user) {
        await this.UserModel.findOneAndUpdate(
            { username: user.username },
            { $set: { isOnline: user.isOnline } },
            { new: true }
        );
    }

    async updateUserAgreement(user) {
        await this.UserModel.findOneAndUpdate(
            { username: user.username },
            { $set: { isAgree: user.isAgree } },
            { new: true }
        );
    }

    async updateUserStatus(user) {
        await this.UserModel.findOneAndUpdate(
            { username: user.username },
            { $set: { isSharingStatus: user.isSharingStatus } },
            { new: true }
        );

        await this.UserModel.findOneAndUpdate(
            { username: user.username },
            { $set: { status: user.status } },
            { new: user.status }
        );

        await this.UserModel.findOneAndUpdate(
            { username: user.username },
            { $set: { timestamp: user.timestamp } },
            { new: user.timestamp }
        );
    }

    async countActiveAdministratorNum() {
        return await this.UserModel.countDocuments({
            privilege: 'Administrator',
            isActive: true,
        });
    }

    /*
     * --------------------- Public Message Operations ---------------------
     */
    async saveMessage(message){
        const newMessage = new this.MessageModel({
            sender: message.sender._id,
            content: message.content,
            receiver: message.receiver ? message.receiver._id : null,
            type: message.type,
            status: message.status,
            receiverStatus: message.receiverStatus
        });
        await newMessage.save();

        const sender = message.sender;
        const receiver = message.receiver;
        message.setAllFields(newMessage);
        message.sender = sender; // replace user._id by the actual User instance
        message.receiver = receiver;
        return message;
    }

    async getAllPublicMessages() {
        const messageRecords = await this.MessageModel
            .find({type: 'public'})
            .populate('sender')
            .exec();
        return messageRecords.map(record => {
            const message = new Message().setAllFields(record);
            message.sender = new User().setAllFields(record.sender);
            return message;
        });
    }

    async getAllPublicMessagesByUser(user) {
        const messageRecords = await this.MessageModel
            .find({sender: user._id, type: 'public'})
            .populate('sender')
            .exec();
        return messageRecords.map(record => {
            const message = new Message().setAllFields(record);
            message.sender = new User().setAllFields(record.sender);
            return message;
        });
    }

    /*
     * --------------------- Private Message Operations ---------------------
     */
    async getAllPrivateMessagesBetweenUsers(user1, user2) {
        const messageRecords = await this.MessageModel
            .find({
                $or: [
                    {sender: user1._id, receiver: user2._id},
                    {sender: user2._id, receiver: user1._id}
                ]
            })
            .populate('sender')
            .populate('receiver')
            .exec();
        return messageRecords.map(record => {
            const message = new Message().setAllFields(record);
            message.sender = new User().setAllFields(record.sender);
            message.receiver = new User().setAllFields(record.receiver);
            return message;
        });
    }

    async getAllPrivateMessagesByUser(user) {
        const messageRecords = await this.MessageModel
            .find({sender: user._id})
            .populate('sender')
            .populate('receiver')
            .exec();
        return messageRecords.map(record => {
            const message = new Message().setAllFields(record);
            message.sender = new User().setAllFields(record.sender);
            message.receiver = new User().setAllFields(record.receiver);
            return message;
        });
    }

    async markMessagesRead(sender, receiver) {
        await this.MessageModel.updateMany({
            sender: sender._id,
            receiver: receiver._id,
        }, { isRead: true });
    }

    /*
     * --------------------- Announcement Operations ---------------------
     */
    async saveAnnouncement(announcement) {
        const newAnnouncement = new this.AnnouncementModel({
            sender: announcement.sender._id,
            content: announcement.content
        });
        await newAnnouncement.save();

        const sender = announcement.sender;
        announcement.setAllFields(newAnnouncement);
        announcement.sender = sender; // replace user._id by the actual User instance
        return announcement;
    }

    async getAllAnnouncements() {
        const records = await this.AnnouncementModel
            .find()
            .populate('sender')
            .exec();
        return records.map(record => {
            const message = new Announcement().setAllFields(record);
            message.sender = new User().setAllFields(record.sender);
            return message;
        });
    }

    /*
     * --------------------- Post Operations ---------------------
     */
    async savePost(post) {
        const newPost = new this.PostModel({
            sender: post.sender._id,
            content: post.content,
            timestamp: post.timestamp,
            imgUrl: post.imgUrl
        });
        await newPost.save();

        const sender = post.sender;
        post.setAllFields(newPost);
        post.sender = sender; // replace user._id by the actual User instance
        return post;
    }

    async getAllPosts() {
        const records = await this.PostModel
            .find()
            .populate('sender')
            .exec();
        return records.map(record => {
            const post = new Post().setAllFields(record);
            post.sender = new User().setAllFields(record.sender);
            return post;
        });
    }

    async findPostById(postId) {
        const record = await this.PostModel.findById(postId).populate('sender').exec();
        const post = new Post().setAllFields(record);
        post.sender = new User().setAllFields(record.sender);
        return post;
    }

    async deletePost(post) {
        await this.PostModel.findByIdAndDelete(post._id);
    }

    async updatePostContent(post) {
        await this.PostModel.findByIdAndUpdate(
            post._id,
            { $set: { content: post.content } },
            { new: true }
        );
    }

    async updatePostImgUrl(post) {
        await this.PostModel.findByIdAndUpdate(
            post._id,
            { $set: { imgUrl: post.imgUrl } },
            { new: true }
        );
    }

    /*
     * --------------------- Post Message Operations ---------------------
     */
    async savePostMessage(postMessage) {
        const newPostMessage = new this.PostMessageModel({
            sender: postMessage.sender._id,
            content: postMessage.content,
            postId: postMessage.postId,
            status: postMessage.status
        });
        await newPostMessage.save();

        const sender = postMessage.sender;
        postMessage.setAllFields(newPostMessage);
        postMessage.sender = sender; // replace user._id by the actual User instance
        return postMessage;
    }

    async deleteAllPostMessagesByPost(postId) {
        await this.PostMessageModel.deleteMany({ postId });
    }

    async getAllPostMessagesByPost(postId) {
        const records = await this.PostMessageModel
            .find({ postId: postId })
            .populate('sender')
            .exec();
        return records.map(record => {
            const postMessage = new PostMessage().setAllFields(record);
            postMessage.sender = new User().setAllFields(record.sender);
            return postMessage;
        });
    }
    /*
     * --------------------- Incident Operations ---------------------
     */
    async saveIncident(incident) {
        const newIncident = new this.IncidentModel({
            type: incident.type,
            description: incident.description,
            location: incident.location,
            reportedBy: incident.reportedBy._id,
            status: incident.status,
            severity: incident.severity,
            timestamp: incident.timestamp,
        });
        await newIncident.save();

        const reportedBy = incident.reportedBy;
        incident.setAllFields(newIncident);
        incident.reportedBy = reportedBy;
        return incident;
    }

    async getAllIncidents() {
        const incidentRecords = await this.IncidentModel
            .find()
            .populate('reportedBy').populate('lastEditedBy')
            .exec();
        return incidentRecords.map(record => {
            const incident = new Incident().setAllFields(record);
            return incident;
        });
    }

    /*
     * --------------------- ResourceRequestPost Operations ---------------------
     */
    static #resourceRequestPostRecord2Instance(record) {
        const post = new ResourceRequestPost().setAllFields(record);
        post.sender = new User().setAllFields(record.sender);
        post.providers = record.providers.map(o => new User().setAllFields(o.provider));
        return post;
    }

    async getAllResourceRequestPost() {
        const records = await this.ResourceRequestPostModel
            .find()
            .populate('sender')
            .populate('providers.provider')
            .exec();
        return records.map(MongoDBImpl.#resourceRequestPostRecord2Instance);
    }

    async getResourceRequestPostById(postId) {
        const record = await this.ResourceRequestPostModel
            .findById(postId)
            .populate('sender')
            .populate('providers.provider')
            .exec();
        if (!record)
            return null;
        return MongoDBImpl.#resourceRequestPostRecord2Instance(record);
    }

    async saveResourceRequestPost(post) {
        const newPostRecord = new this.ResourceRequestPostModel({
            sender: post.sender._id,
            title: post.title,
            requestedItems: post.requestedItems,
            description: post.description,
            address: post.address,
            email: post.email,
            providers: post.providers.map(u => ({provider: u._id})),
        });
        await newPostRecord.save();

        const sender = post.sender;
        const providers = post.providers;
        post.setAllFields(newPostRecord);
        post.sender = sender;
        post.providers = providers;
        return post;
    }

    async updateResourceRequestPost(post) {
        await this.ResourceRequestPostModel.findByIdAndUpdate(post._id, {
            sender: post.sender._id,
            title: post.title,
            requestedItems: post.requestedItems,
            description: post.description,
            address: post.address,
            email: post.email,
            // providers: post.providers.map(u => ({provider: u._id})),
        });
    }

    async updateResourceRequestPostProviders(post) {
        await this.ResourceRequestPostModel.findByIdAndUpdate(post._id, {
            providers: post.providers.map(u => ({provider: u._id})),
        });
    }

    async deleteResourceRequestPost(post) {
        await this.ResourceRequestPostModel.findByIdAndDelete(post._id);
    }

    async findIncidentById(id) {
        const incidentRecord = await this.IncidentModel
          .findById(id)
          .populate('reportedBy').populate('lastEditedBy')
          .exec();
        if (incidentRecord) {
          const incident = new Incident().setAllFields(incidentRecord);
          return incident;
        }
        return null;
    }

    async updateIncident(id, updatedFields) {
        updatedFields.lastEditedBy = updatedFields.lastEditedBy._id;
        const incident = await this.IncidentModel.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true }
        ).populate('reportedBy').populate('lastEditedBy').exec();
        if (incident) {
            const updatedIncident = new Incident().setAllFields(incident);
            return updatedIncident;
        }
        return null;
    }

    async deleteIncidentById(id) {
        const deletedIncident = await this.IncidentModel.findByIdAndDelete(id).populate('reportedBy').populate('lastEditedBy').exec();
        if (deletedIncident) {
          const incident = new Incident().setAllFields(deletedIncident);
          return incident;
        }
        return null;
    }

    /*--------------------- Volunteer Profile & Task Operations ---------------------*/

    getVolunteerTaskSchema() {
        return new Schema({
            assignee: {type: String},
            title: {type: String, required: true},
            helpMessage: {type: String, required: true},
            skill: {type: String},
            fullAddress: {type: String},
            city: {type: String},
            state: {type: String},
            zipCode: {type: String},
            status: {type: String, enum: ['OPEN', 'ACCEPTED', 'COMPLETED'], default: 'OPEN'},
            timestamp: {type: Date, default: Date.now},
            declinedBy: {type: [String]}
        });
    }

    getVolunteerProfileSchema() {
        return new Schema({
            username: {type: String,required: true, unique: true},
            firstName: {type: String, required: true},
            lastName: {type: String},
            skills: {type: [String], required: true},
            availability: {type: [String], required: true},
            city: {type: String, required: true},
            state: {type: String, required: true},
            zipCode: {type: String, required: true},
            phoneNumber: {type: String, required: true},
            consent: {type: Boolean, required: true, default: false}
        });
    }

    async saveVolunteerProfile(volunteer) {
        const newVolunteer = new this.VolunteerProfileModel({
            username: volunteer.username,
            firstName: volunteer.firstName,
            lastName: volunteer.lastName,
            skills: volunteer.skills,
            availability: volunteer.availability,
            city: volunteer.city,
            state: volunteer.state,
            zipCode: volunteer.zipCode,
            phoneNumber: volunteer.phoneNumber,
            consent: volunteer.consent
        });
        await newVolunteer.save();
    }

    async getVolunteerProfile(username) {
        const volunteerRecord = await this.VolunteerProfileModel.findOne({ username: username });
        return (volunteerRecord) ? Volunteer.getVolunteerObject(volunteerRecord) : null;
    }

    async deleteVolunteerProfile(username) {
        await this.VolunteerProfileModel.findOneAndDelete({ username: username });
    }

    async updateVolunteerProfile(volunteer) {
        await this.VolunteerProfileModel.findOneAndUpdate(
            { username: volunteer.username },
            {
                $set: {
                    skills: volunteer.skills,
                    availability: volunteer.availability,
                    city: volunteer.city,
                    state: volunteer.state,
                    zipCode: volunteer.zipCode,
                    phoneNumber: volunteer.phoneNumber,
                    consent: volunteer.consent
                }
            },
            { new: true }
        );
    }

    async saveVolunteerTask(volunteerTask) {
        console.log(`Saving volunteer task to database: ${volunteerTask.title} and skill: ${volunteerTask.skill}`);
        const newVolunteerTask = new this.VolunteerTaskModel({
            assignee: volunteerTask.assignee,
            title: volunteerTask.title,
            helpMessage: volunteerTask.helpMessage,
            fullAddress: volunteerTask.fullAddress,
            city: volunteerTask.city,
            state: volunteerTask.state,
            zipCode: volunteerTask.zipCode,
            status: volunteerTask.status,
            skill: volunteerTask.skill
        });
        newVolunteerTask.save();
    }

    async getVolunteerTasks(username) {
        const volunteerTaskRecords = await this.VolunteerTaskModel.find({ assignee: username });
        if(volunteerTaskRecords.length === 0) {
            return [];
        }
        return volunteerTaskRecords.map(record => {
            return VolunteerTask.getVolunteerTaskObject(record);
        });
    }

    async getAllOpenUnDeclinedTasks(username, volunteer) {
        const startOfToday = DateTimeUtil.getStartOfDayToday();
        const startOfTomorrow = DateTimeUtil.getStartOfDayTomorrow();
        const volunteerTaskRecords = await this.VolunteerTaskModel.find({
            $and: [
                { $or: [ { status: 'OPEN' }, { status: 'DECLINED' } ] },
                { state: volunteer.state, city: volunteer.city },
                { timestamp: { $gte: startOfToday, $lt: startOfTomorrow } },
                { $or: [
                        { declinedBy: { $nin: [username] } },
                        { declinedBy: { $exists: false } },
                        { declinedBy: { $eq: [] } }
                    ]}
            ]
        });
        return volunteerTaskRecords.map(record => {
            return VolunteerTask.getVolunteerTaskObject(record);
        });
    }

    async getVolunteerTask(title) {
        console.log(`Finding task with title: ${title}`);
        const volunteerTaskRecord = await this.VolunteerTaskModel.findOne({ title: title });
        return (volunteerTaskRecord) ? VolunteerTask.getVolunteerTaskObject(volunteerTaskRecord) : null;
    }

    async updateVolunteerTask(task){
        await this.VolunteerTaskModel.findOneAndUpdate(
            { title: task.title },
            { $set: { status: task.status, assignee: task.assignee, declinedBy: task.declinedBy  } },
            { new: true }
        );
    }

    async getAvailableVolunteers(zipCode, city, state, today,taskSkill) {
        const matchingVolunteers = await this.VolunteerProfileModel.find({
            $or: [
                { zipCode: new RegExp('^' + zipCode + '$', 'i') },
                {
                    $and: [
                        { city: new RegExp('^' + city + '$', 'i') },
                        { state: new RegExp('^' + state + '$', 'i') }
                    ]
                }
            ],
            availability: { $regex: new RegExp('^' + today + '$', 'i') }, // Case-insensitive match for today
            skills: { $in: taskSkill },
        });
        return matchingVolunteers.map(record => Volunteer.getVolunteerObject(record));
    }

    async getVolunteerTaskByTitle(title) {
        const startOfToday = DateTimeUtil.getStartOfDayToday();
        const startOfTomorrow = DateTimeUtil.getStartOfDayTomorrow();
        const task = await this.VolunteerTaskModel.findOne({
            title: title ,
            timestamp: {
                $gte: startOfToday,
                $lt: startOfTomorrow
            },
        });
        if (task) {
            return VolunteerTask.getVolunteerTaskObject(task);
        }
        return null;
    }

}