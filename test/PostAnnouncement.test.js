import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { BAD_REQUEST, NOT_FOUND, OK } from "../utils/HttpStatus.js";

// Mock models and utilities
const mockRetrieveAllAnnouncements = jest.fn();
const mockFindUser = jest.fn();
const mockSaveAnnouncement = jest.fn();
const mockMessageSetAllFields = jest.fn();
const mockEmit = jest.fn();
jest.unstable_mockModule('../models/Announcement.js', () => ({
    default: class {
        setAllFields = mockMessageSetAllFields;
        save = mockSaveAnnouncement;
        toResJson = jest.fn().mockImplementation(() => ({ some: 'data' }));
        static retrieveAllAnnouncements = mockRetrieveAllAnnouncements;
    }
}));
jest.unstable_mockModule('../models/User.js', () => ({
    default: { findUser: mockFindUser }
}));
jest.unstable_mockModule('../config/SocketioConfig.js', () => ({
    default: {
        getInstance: jest.fn(() => ({
            getIO: jest.fn(() => ({ emit: mockEmit }))
        }))
    }
}));

// Dynamic import the controller after setting up the mocks
const { default: AnnouncementController } = await import('../controllers/AnnouncementController.js');

describe('AnnouncementController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn()
        };
    });

    test('retrieveAnnouncements - Success', async () => {
        const announcements = [{ content: 'Test Announcement' }];
        mockRetrieveAllAnnouncements.mockResolvedValueOnce(announcements);
        const controller = new AnnouncementController();

        await controller.retrieveAnnouncements(req, res);

        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(announcements);
    });

    test('postAnnouncement - Empty content', async () => {
        req = { body: {} }; // Empty body
        const controller = new AnnouncementController();

        await controller.postAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(BAD_REQUEST);
        expect(res.send).toHaveBeenCalledWith({ message: 'Announcement content is empty' });
    });

    test('postAnnouncement - User not found', async () => {
        req = { body: { announcementContent: 'Hello World!' }, user: { username: 'nonexistentUser' } };
        mockFindUser.mockResolvedValueOnce(null);
        const controller = new AnnouncementController();

        await controller.postAnnouncement(req, res);

        expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'User not found'
        }));
    });

    test('postAnnouncement - Success', async () => {
        req = {
            body: { announcementContent: 'Important announcement' },
            user: { username: 'validUser', getStatus: jest.fn() }
        };
        mockFindUser.mockResolvedValueOnce({ username: 'validUser' });
        const controller = new AnnouncementController();

        await controller.postAnnouncement(req, res);

        expect(mockSaveAnnouncement).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith('post-announcement', expect.anything());
        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith({ message: 'Announcement post successfully' });
    });
});
