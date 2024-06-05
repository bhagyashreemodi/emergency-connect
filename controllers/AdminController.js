import {BAD_REQUEST, NOT_FOUND, OK} from "../utils/HttpStatus.js";
import User from "../models/User.js";
import PasswordHelper from "../utils/PasswordHelper.js";
import SocketioConfig from "../config/SocketioConfig.js";

export default class AdminController {
    constructor() { }

    static async updateUserUsername(user, newUsername) {
        // do not update
        if (newUsername === '' || newUsername === undefined || newUsername === null || user.username === newUsername)
            return {success: true, message: 'Success with no update'};

        user.username = newUsername;
        if (User.isReservedUser(newUsername))
            return {success: false, message: 'Username reserved'};
        if (user.isUsernameTooShort())
            return {success: false, message: 'Username too short'};
        const existingUser = await User.findUser(newUsername);
        if (existingUser)
            return {success: false, message: 'User already exists'};

        return {success: true, message: 'Valid update'};
    }

    static async updateUserPassword(user, newPassword) {
        // do not update
        if (newPassword === '' || newPassword === undefined || newPassword === null)
            return {success: true, message: 'Success with no update'};

        user.password = newPassword;
        if (user.isPasswordTooShort())
            return {success: false, message: 'Password too short'};
        user.password = await PasswordHelper.encryptPassword(user.password);

        return {success: true, message: 'Valid update'};
    }

    static async updateUserIsActive(user, newIsActiveStr) {
        // do not update
        if (newIsActiveStr === '' || newIsActiveStr === undefined || newIsActiveStr === null || user.isActive === (newIsActiveStr === '1'))
            return {success: true, needNotify: false, message: 'Success with no update'};
        if (!new Set(['0', '1']).has(newIsActiveStr))
            return {success: false, needNotify: false, message: 'Invalid input for account status (active / inactive)'};

        const newIsActive = (newIsActiveStr === '1');
        // check At-Least-One-Administrator Rule
        let needNotify = false;
        if (user.isAdmin() && user.isActive && !newIsActive) {
            // if admin && active --> inactive
            const activeAdminNum = await User.countActiveAdministrator();
            if (activeAdminNum <= 1)
                return {success: false, needNotify: false, message: 'Should have at least one active Administrator in the system'};
        }

        user.isActive = newIsActive;
        return {success: true, needNotify: !newIsActive, message: 'Valid update'};
    }

    static async updateUserPrivilege(user, newPrivilege) {
        // do not update
        if (newPrivilege === '' || newPrivilege === undefined || newPrivilege === null || user.privilege === newPrivilege)
            return {success: true, message: 'Success with no update'};
        if (!new Set(['Citizen', 'Coordinator', 'Administrator']).has(newPrivilege))
            return {success: false, message: 'Invalid input for privilege'};

        // check At-Least-One-Administrator Rule
        if (user.isActive && user.isAdmin() && newPrivilege !== 'Administrator') {
            // if active && admin --> non-admin
            const activeAdminNum = await User.countActiveAdministrator();
            if (activeAdminNum <= 1)
                return {success: false, message: 'Should have at least one active Administrator in the system'};
        }

        user.privilege = newPrivilege;
        return {success: true, message: 'Valid update'};
    }

    async updateUser(req, res) {
        const updatedProfile = {
            // if a field is not passed by client, it will be undefined automatically
            username: req.body.username?.trim().toLowerCase(),
            password: req.body.password,
            isActive: req.body.isActive, // string "0" or "1"
            privilege: req.body.privilege,
        };
        const originalUsername = req.params.username?.trim().toLowerCase();
        const user = await User.findUser(originalUsername);
        if (!user)
            return res.status(NOT_FOUND).send({message: 'User not found'});

        // update each field in `user` one by one
        // update username
        const result1 = await AdminController.updateUserUsername(user, updatedProfile.username);
        if (!result1.success)
            return res.status(BAD_REQUEST).send({message: result1.message});
        // update password
        const result2 = await AdminController.updateUserPassword(user, updatedProfile.password);
        if (!result2.success)
            return res.status(BAD_REQUEST).send({message: result2.message});
        // update Account Status (isActive)
        const result3 = await AdminController.updateUserIsActive(user, updatedProfile.isActive);
        if (!result3.success)
            return res.status(BAD_REQUEST).send({message: result3.message});
        // update privilege
        const result4 = await AdminController.updateUserPrivilege(user, updatedProfile.privilege);
        if (!result4.success)
            return res.status(BAD_REQUEST).send({message: result4.message});

        // All update validated. Persist updates to database.
        await user.update();

        const io = SocketioConfig.getInstance().getIO();
        // broadcast when user set inactive
        if (result3.needNotify) {
            io.emit('user-inactive', {username: /*use old username here*/ originalUsername});
        }
        // broadcast when user profile updated
        io.emit('admin-update-user', {username: originalUsername, updatedProfile: updatedProfile});

        return res.status(OK).send({message: 'User profile updated successfully', updatedProfile: updatedProfile});
    }
}