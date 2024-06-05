import DAO from "../db/DAO.js";
import PasswordHelper from "../utils/PasswordHelper.js";
import {BANNED_USER_NAMES} from "../utils/BannedUserNames.js";

export default class User {
    constructor() {
        this._id = null;
        this.username = '';
        this.password = '';
        this.status = 'Undefined';
        this.isOnline = false;
        this.isAgree = false;
        this.isSharingStatus = false;
        this.timestamp = Date.now();
        this.privilege = 'Citizen';
        this.isActive = true;
    }

    setAllFields(obj) {
        this._id        = (obj._id) ? obj._id : null;
        this.username   = (obj.username) ? obj.username.toLowerCase() : '';
        this.password   = (obj.password) ? obj.password : '';
        this.status     = (obj.status) ? obj.status : 'Undefined';
        this.isOnline   = (typeof obj.isOnline === 'boolean') ? obj.isOnline : false;
        this.isAgree    = (typeof obj.isAgree === 'boolean') ? obj.isAgree : false;
        this.isSharingStatus = (typeof obj.isSharingStatus === 'boolean') ? obj.isSharingStatus : false;
        this.timestamp  = (obj.timestamp) ? obj.timestamp : Date.now();
        this.privilege  = (obj.privilege) ? obj.privilege : 'Citizen';
        this.isActive   = (typeof obj.isActive === 'boolean') ? obj.isActive : true;
        return this;
    }

    async save() {
        console.log("Saving user to database");
        this.password = await PasswordHelper.encryptPassword(this.password);
        // object fields of `this` will be automatically updated after `DAO.db.saveUser(this)`
        await DAO.db.saveUser(this);
    }

    async update() {
        await DAO.db.updateUserById(this);
    }

    static async countActiveAdministrator() {
        return await DAO.db.countActiveAdministratorNum();
    }

    isAdmin() {
        return this.privilege === 'Administrator';
    }

    static async saveInitialAdministrator() {
        let defaultAdminUser = this.createInitialAdminUser();
        // check if already exists
        const existingUser = await User.findUser(defaultAdminUser.getUsername());
        if (existingUser)
            return;
        await defaultAdminUser.save();
    }

    static createInitialAdminUser() {
        return new User().setAllFields({
            username: 'ESNAdmin',
            password: 'admin',
            privilege: 'Administrator',
            status: 'OK',
        });
    }

    static async findUser(username) {
        return await DAO.db.getUser(username);
    }

    static async findUserById(id) {
        return await DAO.db.getUserById(id);
    }

    static async getAllUsers() {
        return await DAO.db.getAllUsers();
    }

    static isReservedUser(username) {
        console.log("Checking if user is reserved");
        return BANNED_USER_NAMES.has(username.toLowerCase());
    }

    isUsernameTooShort() {
        console.log("Checking if username is too short");
        return this.username.length < 3;
    }

    isPasswordTooShort() {
        console.log("Checking if password is too short");
        return this.password.length < 4;
    }

    async isPasswordCorrect(password) {
        console.log("Checking if password is correct");
        return await PasswordHelper.comparePassword(password, this.password);
    }

    async setOnlineStatus(status) {
        console.log(`Setting online status for user: ${this.username}`);
        this.isOnline = status;
        await DAO.db.updateUserOnlineStatus(this);
    }

    async setAgreement(isAgree = true) {
        console.log(`Setting agreement for user: ${this.username}`);
        this.isAgree = isAgree;
        await DAO.db.updateUserAgreement(this);
    }

    async setUserStatus(status) {
        console.log(`Setting status for user: ${this.username}`);
        this.status = status;
        this.isSharingStatus = true;
        this.timestamp = Date.now();
        await DAO.db.updateUserStatus(this);
    }

    async markMessagesFromUserRead(sender) {
        await DAO.db.markMessagesRead(sender, this);
    }

    getUsername() {
        return this.username;
    }

    getId() {
        return this._id;
    }

    getPassword() {
        return this.password;
    }

    getStatus() {
        return this.status;
    }

    static async setupUserInTestDB(user) {
        let newUser = new User().setAllFields({
            username: user.username,
            password: user.password,
            status: user.status,
            isOnline: user.isOnline,
            isAgree: user.isAgree,
            isSharingStatus: user.isSharingStatus
        });
        await user.save();
    }
}
