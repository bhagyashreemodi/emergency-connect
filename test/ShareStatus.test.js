import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { NOT_FOUND, OK, INTERNAL_SERVER_ERROR } from "../utils/HttpStatus.js";

// Mock models and utilities
const mockUserFindUser = jest.fn();
const mockUserSetUserStatus = jest.fn();
const mockEmit = jest.fn();
jest.unstable_mockModule('../models/User.js', () => ({
    default: {
        findUser: mockUserFindUser,
        setUserStatus: mockUserSetUserStatus
    }
}));
jest.unstable_mockModule('../config/SocketioConfig.js', () => ({
    default: {
        getInstance: jest.fn(() => ({
            getIO: jest.fn(() => ({ emit: mockEmit }))
        }))
    }
}));

// Import the controller after mocks
const { default: ShareStatusController } = await import('../controllers/ShareStatusController.js');

describe('ShareStatusController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn()
        };
    });

    test('retrieveStatus - User not found', async () => {
        req = { params: { username: 'nonexistent' } };
        mockUserFindUser.mockResolvedValueOnce(null);
        const controller = new ShareStatusController();

        await controller.retrieveStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'User not found'
        }));
    });

    test('retrieveStatus - Internal Server Error', async () => {
        req = { params: { username: 'existingUser' } };
        mockUserFindUser.mockRejectedValueOnce(new Error('Database error'));
        const controller = new ShareStatusController();

        await controller.retrieveStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.send).toHaveBeenCalledWith("Internal Server Error");
    });

    test('retrieveStatus - Success', async () => {
        req = { params: { username: 'existingUser' } };
        mockUserFindUser.mockResolvedValueOnce({ username: 'recipient', getStatus: jest.fn() });
        const controller = new ShareStatusController();

        await controller.retrieveStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Status retrieved successfully!'
        }));
    });

    test('updateStatus - User not found', async () => {
        req = { params: { username: 'nonexistent', status: 'Ok' } };
        mockUserFindUser.mockResolvedValueOnce(null);
        const controller = new ShareStatusController();

        await controller.updateStatus(req, res);

        expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'User not found'
        }));
    });

    test('updateStatus - Success', async () => {
        req = { params: { username: 'existingUser', status: 'OK' } };
        const user = { setUserStatus: mockUserSetUserStatus.mockResolvedValueOnce(undefined) };
        mockUserFindUser.mockResolvedValueOnce(user);
        const controller = new ShareStatusController();

        await controller.updateStatus(req, res);

        expect(mockUserSetUserStatus).toHaveBeenCalledWith('OK');
        expect(mockEmit).toHaveBeenCalledWith('user-update-status');
        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Status updated successfully!'
        }));
    });
});
