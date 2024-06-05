import { jest, describe, expect, test, beforeEach } from '@jest/globals';

const mockSocketEmit = jest.fn();
const mockRRPostToResJson = jest.fn();
const mockRRPostGetAllPosts = jest.fn();
const mockRRPostGetPostById = jest.fn();
const mockRRPostSetAllFields = jest.fn();
const mockRRPostSave = jest.fn();

await jest.unstable_mockModule('../models/ResourceRequestPost.js', () => ({
    default: class ResourceRequestPost {
        static getAllPosts = mockRRPostGetAllPosts;
        static getPostById = mockRRPostGetPostById;
        setAllFields = mockRRPostSetAllFields;
        save = mockRRPostSave;
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

const { default: ResourceSharingController } = await import('../controllers/ResourceSharingController.js');

describe('ResourceSharingController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn()
        };
    });

    test('getAllPosts - Success', async () => {
        mockRRPostToResJson.mockImplementation(() => 'post');
        mockRRPostGetAllPosts.mockResolvedValueOnce([{toResJson: mockRRPostToResJson}, {toResJson: mockRRPostToResJson}]);

        const controller  = new ResourceSharingController();
        await controller.getAllPosts(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith(['post', 'post']);
    });

    test('getPostById - Success', async () => {
        mockRRPostToResJson.mockImplementation(() => 'post');
        mockRRPostGetPostById.mockResolvedValueOnce({toResJson: mockRRPostToResJson});

        req = {
            params: {postId: '123456'}
        }
        const controller  = new ResourceSharingController();
        await controller.getPostById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith('post');
    });

    test('getPostById - Not Found', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce(null);

        req = {
            params: {postId: '123456'}
        }
        const controller  = new ResourceSharingController();
        await controller.getPostById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.send).toHaveBeenCalledWith({message: 'Post not found'});
    });

    test('createNewPost - Success', async () => {
        mockRRPostSetAllFields.mockResolvedValueOnce({save: mockRRPostSave});

        req = {
            body: {formData: {
                    requestedItems: ['item1', 'item2', 'item3']
                }},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.createNewPost(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({message: 'New post created successfully'});
    });

    test('updatePost - Success', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce({
            sender: {username: 'fakeUsername'},
            toResJson: mockRRPostToResJson,
            setAllFields: jest.fn(),
            update: jest.fn()
        });

        req = {
            params: {postId: '123456'},
            body: {formData: {
                    requestedItems: ['item1', 'item2', 'item3']
                }},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.updatePost(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith({message: 'Post updated successfully'});
    });

    test('updatePost - Not Found', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce(null);

        req = {
            params: {postId: '123456'},
            body: {formData: {
                    requestedItems: ['item1', 'item2', 'item3']
                }},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.updatePost(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('updatePost - Forbidden', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce({
            sender: {username: 'different_fakeUsername'},
            toResJson: mockRRPostToResJson,
            setAllFields: jest.fn(),
            update: jest.fn()
        });

        req = {
            params: {postId: '123456'},
            body: {formData: {
                    requestedItems: ['item1', 'item2', 'item3']
                }},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.updatePost(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('updatePostProvider - Success', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce({
            sender: {username: 'differentFakeUsername'},
            toResJson: mockRRPostToResJson,
            setAllFields: jest.fn(),
            updateAddProvider: jest.fn()
        });

        req = {
            params: {postId: '123456'},
            body: {formData: {
                    skipEmailNotification: true
                }},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.updatePostProvider(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('updatePostProvider - Not Found', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce(null);

        req = {
            params: {postId: '123456'},
            body: {formData: {
                    skipEmailNotification: true
                }},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.updatePostProvider(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('updatePostProvider - Forbidden', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce({
            sender: {username: 'fakeUsername'},
            toResJson: mockRRPostToResJson,
            setAllFields: jest.fn(),
            updateAddProvider: jest.fn()
        });

        req = {
            params: {postId: '123456'},
            body: {formData: {
                    skipEmailNotification: true
                }},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.updatePostProvider(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    test('deletePost - Success', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce({
            sender: {username: 'fakeUsername'},
            toResJson: mockRRPostToResJson,
            setAllFields: jest.fn(),
            delete: jest.fn()
        });

        req = {
            params: {postId: '123456'},
            body: {},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.deletePost(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('deletePost - Not Found', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce(null);

        req = {
            params: {postId: '123456'},
            body: {},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.deletePost(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('deletePost - Forbidden', async () => {
        mockRRPostGetPostById.mockResolvedValueOnce({
            sender: {username: 'differentFakeUsername'},
            toResJson: mockRRPostToResJson,
            setAllFields: jest.fn(),
            delete: jest.fn()
        });

        req = {
            params: {postId: '123456'},
            body: {},
            user: {username: 'fakeUsername'}
        }
        const controller  = new ResourceSharingController();
        await controller.deletePost(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });
});
