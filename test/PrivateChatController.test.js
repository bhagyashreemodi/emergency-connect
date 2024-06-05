import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import {Error} from "mongoose";

// Mock utilities and models
await jest.unstable_mockModule('../utils/HttpStatus.js', () => ({
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    OK: 200
}));

const mockUserFindUser = jest.fn();
const mockMessageSave = jest.fn();
const mockMessageSetAllFields = jest.fn();
const mockSocketEmit = jest.fn();
const mockRetrieveAllPrivateMessagesBetweenUsers = jest.fn();
const mockRetrieveAllPrivateMessagesByUser = jest.fn();
await jest.unstable_mockModule('../models/User.js', () => ({
    default: class User { static findUser = mockUserFindUser }
}));
await jest.unstable_mockModule('../models/Message.js', () => ({
    default: class Message {
        setAllFields = mockMessageSetAllFields;
        save = mockMessageSave;
        toResJson = jest.fn(() => ({ some: 'data' }));
        static retrieveAllPrivateMessagesBetweenUsers = mockRetrieveAllPrivateMessagesBetweenUsers;
        static retrieveAllPrivateMessagesByUser = mockRetrieveAllPrivateMessagesByUser;
    }
}));
await jest.unstable_mockModule('../config/SocketioConfig.js', () => ({
    default: {
        getInstance: jest.fn(() => ({
            getSocketIdsByUsername: jest.fn(() => ['socketId1', 'socketId2']),
            getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: mockSocketEmit })) }))
        }))
    }
}));

// Dynamic import the controller after setting up the mocks
const { default: PrivateChatController } = await import('../controllers/PrivateChatController.js');

describe('PrivateChatController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn()
        };
    });

    test('sendMessagePrivately - Success', async () => {
        req = {
            body: { recipientUsername: 'recipient', messageContent: 'Hello' },
            user: { username: 'sender', getStatus: jest.fn() }
        };
        mockUserFindUser.mockResolvedValueOnce({ username: 'recipient', getStatus: jest.fn() });
        const controller = new PrivateChatController();

        await controller.sendMessagePrivately(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ message: "Message sent successfully" });
        expect(mockSocketEmit).toHaveBeenCalledTimes(4); // Twice for sender and recipient each
    });

    test('sendMessagePrivately - Invalid request body', async () => {
        req = {
            body: {},
            user: { username: 'sender', getStatus: jest.fn() }
        };
        const controller = new PrivateChatController();

        await controller.sendMessagePrivately(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Invalid request body" });
    });

    test('sendMessagePrivately - Internal Server Error', async () => {
        req = {
            body: { recipientUsername: 'recipient', messageContent: 'Hello' },
            user: { username: 'sender', getStatus: jest.fn() }
        };
        mockUserFindUser.mockRejectedValueOnce(new Error('Database error'));
        const controller = new PrivateChatController();

        await controller.sendMessagePrivately(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Internal Server Error");
    });

    test('getAllPrivateMessagesByUser - responds with messages when both users are found', async () => {
         req = {
            params: {
                username1: 'user1',
                username2: 'user2'
            }
        };
        mockUserFindUser.mockImplementation(username => Promise.resolve({ username }));
        mockRetrieveAllPrivateMessagesBetweenUsers.mockResolvedValue(['message1', 'message2']);

        const controller = new PrivateChatController();
        await controller.getPrivateMessagesBetweenUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(['message1', 'message2']);
    });

    test('getAllPrivateMessagesByUser: BAD_REQUEST when one or both users are not found', async () => {
        req = {
            params: {
                username1: 'user1',
                username2: 'user2'
            }
        };
        mockUserFindUser.mockResolvedValueOnce(null);
        const controller = new PrivateChatController();
        await controller.getPrivateMessagesBetweenUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "User not found" });
    });

    test('getAllPrivateMessagesByUser: Internal Server Error', async () => {
        req = {
            params: {
                username1: 'user1',
                username2: 'user2'
            }
        };
        mockUserFindUser.mockRejectedValueOnce(new Error('Database error'));
        const controller = new PrivateChatController();
        await controller.getPrivateMessagesBetweenUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Internal Server Error");
    });

    test('getAllPrivateMessagesByUser: responds with messages for a valid user', async () => {
        req = { params: { username: 'existingUser' } };
        mockUserFindUser.mockResolvedValueOnce({ username: 'existingUser' });
        mockRetrieveAllPrivateMessagesByUser.mockResolvedValue(['message1', 'message2']);

        const controller = new PrivateChatController();
        await controller.getAllPrivateMessagesByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(['message1', 'message2']);
    });

    test('getAllPrivateMessagesByUser: responds with BAD_REQUEST when user not found', async () => {
        req = { params: { username: 'nonExistingUser' } };
        mockUserFindUser.mockResolvedValueOnce(null);

        const controller = new PrivateChatController();
        await controller.getAllPrivateMessagesByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "User not found" });
    });

    test('markMessagesRead: marks messages as read and responds with success', async () => {
        req = {
            params: { username: 'existingUser' },
            user: { markMessagesFromUserRead: jest.fn().mockResolvedValue(true) }
        };
        mockUserFindUser.mockResolvedValueOnce({ username: 'existingUser' });

        const controller = new PrivateChatController();
        await controller.markMessagesRead(req, res);

        expect(req.user.markMessagesFromUserRead).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ message: 'success' });
    });

    test('markMessagesRead: responds with BAD_REQUEST when username is missing', async () => {
        req = {
            params: { username: '' }
        };

        const controller = new PrivateChatController();
        await controller.markMessagesRead(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ message: "Invalid request" });
    });

    test('markMessagesRead: responds with Internal Server Error when user is not found', async () => {
        req = {
            params: { username: 'nonExistingUser' }
        };
        mockUserFindUser.mockRejectedValueOnce(new Error('User not found.'));

        const controller = new PrivateChatController();
        await controller.markMessagesRead(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Internal Server Error" );
    });

});
