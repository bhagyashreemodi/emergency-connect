import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { NOT_FOUND, OK, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "../utils/HttpStatus.js";

// Mock models and utilities
const mockRetrieveAllPosts = jest.fn();
const mockFindUser = jest.fn();
const mockSavePost = jest.fn();
const mockPostsSetAllFields = jest.fn();
const mockDelete = jest.fn();
const mockEmit = jest.fn();
const mockFindPostById = jest.fn();
const mockUpdateContent = jest.fn();
const mockUpdateImgUrl = jest.fn();
const mockDeleteAllPostMessages = jest.fn();
jest.unstable_mockModule('../models/Post.js', () => ({
    default: class {
        setAllFields = mockPostsSetAllFields;
        save = mockSavePost;
        toResJson = jest.fn().mockImplementation(() => ({ some: 'data' }));
        updateContent = mockUpdateContent;
        updateImgUrl = mockUpdateImgUrl;
        delete = mockDelete;
        static retrieveAllPosts = mockRetrieveAllPosts;
        static findPostById = mockFindPostById;
    }
}));
jest.unstable_mockModule('../models/PostMessage.js', () => ({
    default: class {
        static deleteAllPostMessages = mockDeleteAllPostMessages;
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
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: {
            upload_stream: (options, callback) => {
                callback(null, { secure_url: './test/test-files/test-file.jpg' });
            }
        }
    }
}));

// Dynamic import the controller after setting up the mocks
const { default: ShelterPostController } = await import('../controllers/ShelterPostController.js');
describe('AnnouncementController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn()
        };
    });

    test('retrievePosts - Success', async () => {
        const posts = [{ content: 'Test Post' }];
        mockRetrieveAllPosts.mockResolvedValueOnce(posts);
        const controller = new ShelterPostController();

        await controller.retrieveShelterPosts(req, res);

        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(posts);
    });

    test('createShelterPost - No file uploaded.', async () => {
        req = { file: null };
        const controller = new ShelterPostController();

        await controller.createShelterPost(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith("No file uploaded.");
    });

    test('createShelterPost - User not found', async () => {
        req = {
            file: { buffer: 'fileBuffer' }, body: { msg: 'Hello World!' }, user
                : { username: 'nonexistentUser' }
        };
        mockFindUser.mockResolvedValueOnce(null);
        const controller = new ShelterPostController();
        await controller.createShelterPost(req, res);
        expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'User not found'
        }));

    });

    test('createShelterPost - Success', async () => {
        req = {
            file: { buffer: 'fileBuffer' }, body: { msg: 'Hello World!' }, user
                : { username: 'existentUser' }
        };
        mockFindUser.mockResolvedValueOnce({ username: 'valid' });
        const controller = new ShelterPostController();
        await controller.createShelterPost(req, res);
        expect(mockSavePost).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith('shelter-post', expect.anything());
        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Shelter post created successfully'
        }));
    });

    test('createShelterPost - Error uploading to Cloudinary', async () => {
        req = {
            file: { buffer: 'fileBuffer' }, body: { msg: 'Hello World!' }, user
                : { username: 'existentUser' }
        };
        mockFindUser.mockResolvedValueOnce({ username: 'valid' });
        mockSavePost.mockRejectedValueOnce(new Error('Error uploading to Cloudinary'));
        const controller = new ShelterPostController();
        await controller.createShelterPost(req, res);
        expect(res.status).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR);
        expect(res.send).toHaveBeenCalledWith('Error uploading to Cloudinary');
    });

    test('updateShelterPost - Post not found', async () => {
        req = { params: { postId: 'nonexistentPost' } };
        mockFindPostById.mockResolvedValueOnce(null);
        const controller = new ShelterPostController();
        await controller.updateShelterPost(req, res);
        expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
        expect(res.send).toHaveBeenCalledWith('Post not found');
    });

    test('updateShelterPost - Unauthorized', async () => {
        req = { params: { postId: 'existentPost' }, user: { username: 'nonexistentUser' } };
        mockFindPostById.mockResolvedValueOnce({ sender: { username: 'existentUser' } });
        const controller = new ShelterPostController();
        await controller.updateShelterPost(req, res);
        expect(res.status).toHaveBeenCalledWith(UNAUTHORIZED);
        expect(res.send).toHaveBeenCalledWith('Unauthorized');
    });

    test('updateShelterPost - Success', async () => {
        req = {
            params: { postId: 'existentPost' },
            file: { buffer: Buffer.from('fileBuffer') },
            body: { msg: 'Updated content' },
            user: { username: 'existentUser' }
        };

        // Setup mock return value directly in the test if specific setup is needed
        mockFindPostById.mockResolvedValue({
            sender: { username: 'existentUser' },
            updateContent: mockUpdateContent,
            updateImgUrl: mockUpdateImgUrl,
            toResJson: jest.fn().mockReturnValue({ some: 'data' }),
        });

        const controller = new ShelterPostController();
        await controller.updateShelterPost(req, res);

        expect(mockUpdateContent).toHaveBeenCalledWith();
        expect(mockUpdateImgUrl).toHaveBeenCalled();
        expect(mockEmit).toHaveBeenCalledWith('update-shelter-post', expect.anything());
        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Update Shelter Post'
        }));
    });

    test('deleteShelterPost - Post not found', async () => {
        req = { params: { postId: 'nonexistentPost' } };
        mockFindPostById.mockResolvedValueOnce(null);
        const controller = new ShelterPostController();
        await controller.deleteShelterPost(req, res);
        expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
        expect(res.send).toHaveBeenCalledWith('Post not found');
    });

    test('deleteShelterPost - Unauthorized', async () => {
        req = { params: { postId: 'existentPost' }, user: { username: 'nonexistentUser' } };
        mockFindPostById.mockResolvedValueOnce({ sender: { username: 'existentUser' } });
        const controller = new ShelterPostController();
        await controller.deleteShelterPost(req, res);
        expect(res.status).toHaveBeenCalledWith(UNAUTHORIZED);
        expect(res.send).toHaveBeenCalledWith('Unauthorized');
    });

    test('deleteShelterPost - Success', async () => {
        req = {
            params: { postId: 'existentPost' },
            user: { username: 'existentUser' }
        };

        // Assuming the setup above is correct
        mockFindPostById.mockResolvedValue({
            sender: { username: 'existentUser' },
            delete: mockDelete // Ensure this method is mocked
        });

        const controller = new ShelterPostController();
        await controller.deleteShelterPost(req, res);

        expect(mockDelete).toHaveBeenCalled(); // Verify that the mock delete method is called
        expect(mockDeleteAllPostMessages).toHaveBeenCalledWith('existentPost'); // Ensure post messages are also deleted
        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Shelter post deleted successfully'
        }));
    });
});
