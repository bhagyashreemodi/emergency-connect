import User from "../models/User.js";
import { BAD_REQUEST, CREATED, FORBIDDEN, NOT_FOUND, OK, UNAUTHORIZED, INTERNAL_SERVER_ERROR } from "../utils/HttpStatus.js";
import ResponseBody from "../models/ReponseBody.js";
import { SECRET_KEY } from "../utils/Constants.js";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";

export default class AuthController {
    constructor() { }

    async register(req, res) {
        const username = req.body.username?.trim().toLowerCase();    // case-insensitive
        const password = req.body.password;
        console.log(`[Register] username: ${username}, password: ${password}`);

        let newUser = new User().setAllFields({
            username: username,
            password: password
        });
        // validate new user
        let responseBody = new ResponseBody();
        if (User.isReservedUser(newUser.getUsername())) {
            console.log(`[Register] Reserved User: ${newUser.getUsername()}`);
            responseBody.setMessage('Username reserved');
            return res.status(FORBIDDEN).send(responseBody);
        }
        if (newUser.isUsernameTooShort()) {
            console.log(`[Register] Username too short: ${newUser.getUsername()}`);
            responseBody.setMessage('Username too short');
            return res.status(BAD_REQUEST).send(responseBody);
        }
        if (newUser.isPasswordTooShort()) {
            console.log(`[Register] Password too short: ${newUser.getPassword()}`);
            responseBody.setMessage('Password too short');
            return res.status(BAD_REQUEST).send(responseBody);
        }
        const existingUser = await User.findUser(newUser.getUsername());
        if (existingUser) {
            console.log(`[Register] User already exists: ${newUser.getUsername()}`);
            responseBody.setMessage('User already exists');
            return res.status(BAD_REQUEST).send(responseBody);
        }
        // save new user
        await newUser.save();
        return res
            .status(CREATED)
            .send("Store user data in database");
    }

    async getUser(req, res) {
        const username = req.params.username.trim().toLowerCase();
        console.log(`[getUser] username: ${username}`);

        let responseBody = new ResponseBody();
        const user = await User.findUser(username);
        if (!user) {
            console.log(`[getUser] User not found: ${username}`);
            responseBody.setMessage('User not found');
            console.log(responseBody);
            return res.status(NOT_FOUND).send(responseBody);
        }

        return res
            .status(OK)
            .send(responseBody.buildGetUserResponse(user));
    }

    async login(req, res) {
        const username = req.body.username?.trim().toLowerCase();    // case-insensitive
        const password = req.body.password;
        console.log(`[Login] username: ${username}`);

        let responseBody = new ResponseBody();
        const user = await User.findUser(username);
        if (!user) {
            console.log(`[getUser] User not found: ${username}`);
            responseBody.setMessage('User not found');
            console.log(responseBody);
            return res.status(NOT_FOUND).send(responseBody);
        }
        if (!await (user.isPasswordCorrect(password))) {
            responseBody.setMessage('Wrong password');
            return res.status(BAD_REQUEST).send(responseBody);
        }

        if (!user.isActive) {
            console.log(`[Login] User account is inactive: ${username}`);
            responseBody.setMessage('User account is currently inactive. Login not allowed.');
            return res.status(FORBIDDEN).send(responseBody);
        }
        if (!user.isAgree) {
            console.log(`[Login] User has not agreed to terms: ${username}`);
            responseBody.setMessage('User has not agreed to terms');
            return res.status(UNAUTHORIZED).send(responseBody);
        }
        await user.setOnlineStatus(true); // already done by socket
        const token = jwt.sign({ username: user.getId() }, SECRET_KEY, { expiresIn: '1h' });
        return res
            .status(OK)
            .send(responseBody.buildLoginSuccessResponse(user, token));
    }

    async logout(req, res) {
        const username = req.params.username.trim().toLowerCase();
        console.log(`[Logout] username: ${username}`);

        try {
            const user = await User.findUser(username);
            if (!user) {
                return res.status(NOT_FOUND).send("User not found");
            }
            await user.setOnlineStatus(false); // already done by socket

            return res.status(OK).send("Logged out successfully");
        } catch (error) {
            console.error(`[Logout] Error logging out user ${username}: ${error}`);
            return res.status(INTERNAL_SERVER_ERROR).send("Error logging out");
        }
    }

    // Function to sort users
    static sortUsers(users) {
        return users.sort((a, b) => {
            if (a.isOnline && !b.isOnline) return -1;
            if (!a.isOnline && b.isOnline) return 1;
            return a.username.localeCompare(b.username);
        });
    }

    // Function to format user data
    static async formatUserData(client, users) {
        return Promise.all(users.map(async (user) => {
            const messages = await Message.retrieveAllPrivateMessagesBetweenUsers(client, user);
            const chatted = messages.length > 0;
            const unread = messages.reduce((acc, message) => {
                if (message.username === user.username && message.receiver === client.username && !message.isRead) {
                    return acc + 1;
                }
                return acc;
            }, 0);
            const lastMessage = messages.at(-1);
            const lastMessageStr = lastMessage ? `${lastMessage.username}: ${lastMessage.message}` : '';

            return {
                username: user.username,
                isOnline: user.isOnline,
                status: user.status,
                chatted: chatted,
                unread: unread,
                lastMessage: lastMessageStr,
            };
        }));
    }

    // Main function to get all users
    async getAllUsers(req, res) {
        try {
            const client = req.user;
            let users = await User.getAllUsers(); // Assume this fetches users without sorting
            if (!client.isAdmin()) // only admin can see inactive users
                users = users.filter((user) => user.isActive);
            users = AuthController.sortUsers(users); // Sort users
            const formattedUsers = await AuthController.formatUserData(client, users); // Format user data
            res.json(formattedUsers);
        } catch (error) {
            console.error("Failed to get directory list", error);
            res.status(500).send("Internal Server Error"); // Use a constant for status code if available
        }
    }

    async agreeToTerms(req, res) {
        const username = req.params.username.trim().toLowerCase();
        console.log(`[AgreeToTerms] username: ${username}`);
        let responseBody = new ResponseBody();

        try {
            const user = await User.findUser(username);
            await user.setAgreement(true);
            // await user.setOnlineStatus(true);
            const token = jwt.sign({ username: user.getId() }, SECRET_KEY, { expiresIn: '1h' });
            return res
                .status(OK)
                .send(responseBody.buildUserCreatedResponse(user, token));
        } catch (error) {
            console.error(`[AgreeToTerms] Error agreeing to terms for user ${username}: ${error}`);
            return res.status(INTERNAL_SERVER_ERROR).send("Error agreeing to terms");
        }
    }
}