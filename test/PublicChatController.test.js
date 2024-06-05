import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import {Error} from "mongoose";

// Mock utilities and models
await jest.unstable_mockModule('../utils/HttpStatus.js', () => ({
    NOT_FOUND: 404,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    OK: 200
}));

const mockUserFindUser = jest.fn();
const mockMessageSave = jest.fn();
const mockMessageSetAllFields = jest.fn();
const mockSocketEmit = jest.fn();
const mockRetrieveAllPublicMessages = jest.fn();
const mockRetrieveAllPublicMessagesByUser = jest.fn();
await jest.unstable_mockModule('../models/User.js', () => ({
    default: class User { static findUser = mockUserFindUser }
}));
await jest.unstable_mockModule('../models/Message.js', () => ({
    default: class Message {
        setAllFields = mockMessageSetAllFields;
        save = mockMessageSave;
        toResJson = jest.fn(() => ({ some: 'data' }));
        static retrieveAllPublicMessages  = mockRetrieveAllPublicMessages;
        static retrieveAllPublicMessagesByUser = mockRetrieveAllPublicMessagesByUser;
    }
}));
await jest.unstable_mockModule('../config/SocketioConfig.js', () => ({
    default: {
        getInstance: jest.fn(() => ({
            getSocketIdsByUsername: jest.fn(() => ['socketId1', 'socketId2']),
            getIO: jest.fn(() => ({ emit: mockSocketEmit }))
        }))
    }
}));

const { default: PublicChatController } = await import('../controllers/PublicChatController.js');

describe('PublicChatController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn()
        };
    });

    test('PublicChatController constructor called', () => {
        const publicChatController = new PublicChatController();
        expect(publicChatController).toBeDefined();
    });

    test('sendMessagePublicly - empty messageContent', async () => {
        const req = { body: { messageContent: '' }, user: {} };
        const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
        const publicChatController = new PublicChatController();
        await publicChatController.sendMessagePublicly(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({message: 'Message content is empty'});
    });

    test('sendMessagePublicly - Success', async () => {
        req = {
            body: { messageContent: 'Hello' },
            user: { username: 'sender', getStatus: jest.fn() }
        };
        mockUserFindUser.mockResolvedValueOnce({ username: 'sender', getStatus: jest.fn() });

        const controller = new PublicChatController();
        await controller.sendMessagePublicly(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({ message: "Message sent successfully" });
        expect(mockSocketEmit).toHaveBeenCalledTimes(1);
    });

    test('sendMessagePublicly - User Not Found', async () => {
        req = {
            body: { messageContent: 'Hello' },
            user: { username: 'sender', getStatus: jest.fn() }
        };
        mockUserFindUser.mockResolvedValueOnce(null);

        const controller = new PublicChatController();
        await controller.sendMessagePublicly(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('getAllPublicMessages', async () => {
        mockRetrieveAllPublicMessages.mockResolvedValue(['message1', 'message2']);

        const controller = new PublicChatController();
        await controller.getAllPublicMessages(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(['message1', 'message2']);
    });

    test('getPublicMessagesByUser - Success', async () => {
        req = { params: {username: 'sender'} };
        mockUserFindUser.mockImplementation(username => Promise.resolve({ username }));
        mockRetrieveAllPublicMessagesByUser.mockResolvedValue(['message1', 'message2']);

        const controller = new PublicChatController();
        await controller.getPublicMessagesByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(['message1', 'message2']);
    });

    test('getPublicMessagesByUser - User Not Found', async () => {
        req = { params: {username: 'sender'} };
        mockUserFindUser.mockImplementation(username => Promise.resolve(null));

        const controller = new PublicChatController();
        await controller.getPublicMessagesByUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });
});
