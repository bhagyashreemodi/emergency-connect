import { jest, describe, expect, test, beforeEach } from '@jest/globals';

const mockUserFindUser = jest.fn();
const mockUserGetAllUsers = jest.fn();
const mockAnnouncementGetAllAnnouncements = jest.fn();
const mockMessageGetAllPublicMessages = jest.fn();
const mockMessageGetAllPrivateMessagesBetweenUsers = jest.fn();

await jest.unstable_mockModule('../../models/User.js', () => ({
    default: class User { 
        static findUser = mockUserFindUser;
        static getAllUsers = mockUserGetAllUsers;
    }
}));
await jest.unstable_mockModule('../../models/Announcement.js', () => ({
    default: class Announcement { static getAllAnnouncements = mockAnnouncementGetAllAnnouncements }
}));
await jest.unstable_mockModule('../../models/Message.js', () => ({
    default: class Message {
        static getAllPublicMessages = mockMessageGetAllPublicMessages;
        static getAllPrivateMessagesBetweenUsers = mockMessageGetAllPrivateMessagesBetweenUsers;
    }
}));

const { UserSearchResultFactory,
AnnouncementSearchResultFactory,
PublicMessageSearchResultFactory,
PrivateMessageSearchResultFactory, } = await import('../../utils/SearchUtil.js');

describe('UserSearchResultFactory', () => {
    let criteria;
    beforeEach(() => {
        jest.clearAllMocks();

        mockUserGetAllUsers.mockResolvedValueOnce([
            {
                username: 'garyc',
                status: 'OK',
                isOnline: false,
                timestamp: Date.now(),
            },
            {
                username: 'igary',
                status: 'OK',
                isOnline: true,
                timestamp: Date.now(),
            },
            {
                username: 'chen',
                status: 'Help',
                isOnline: false,
                timestamp: Date.now(),
            },
            {
                username: 'chen2',
                status: 'OK',
                isOnline: false,
                timestamp: Date.now(),
            }
        ]);
    });

    test('search user by status', async () => {
        criteria = {
            context: 'user',
            // keyword: 'gary',
            status: 'OK',
        };

        const factory = new UserSearchResultFactory();
        const result = await factory.getAllResultJson(criteria);

        expect(result.totalResults).toBe(3);
        expect(result.results[0].username).toBe('igary');
        expect(result.results[1].username).toBe('chen2');
        expect(result.results[2].username).toBe('garyc');
    });

    test('search user by name', async () => {
        criteria = {
            context: 'user',
            keyword: 'gar',
            // status: 'OK',
        };

        const factory = new UserSearchResultFactory();
        const result = await factory.getAllResultJson(criteria);

        expect(result.totalResults).toBe(2);
        expect(result.results[0].username).toBe('igary');
        expect(result.results[1].username).toBe('garyc');
    });

    test('search user by name 2', async () => {
        criteria = {
            context: 'user',
            keyword: 'g',
            // status: 'OK',
        };

        const factory = new UserSearchResultFactory();
        const result = await factory.getAllResultJson(criteria);

        expect(result.totalResults).toBe(2);
        expect(result.results[0].username).toBe('igary');
        expect(result.results[1].username).toBe('garyc');
    });
});

describe('AnnouncementSearchResultFactory', () => {
    let criteria;
    beforeEach(() => {
        jest.clearAllMocks();
        mockAnnouncementGetAllAnnouncements.mockResolvedValueOnce([
            {
                sender: { username: 'gary' },
                timestamp: new Date(),
                content: 'FSE is my favorite course.',
            }
        ]);
    });

    test('search announcement by key word', async () => {
        criteria = {
            context: 'announcement',
            keyword: 'FSE are their favorite',
            offset: 0,
            limit: 10,
        };

        const factory = new AnnouncementSearchResultFactory();
        const result = await factory.getAllResultJson(criteria);

        expect(result.totalResults).toBe(1);
        expect(result.results[0].message).toBe('FSE is my favorite course.');
    });

    test('search announcement by key word - all stop words', async () => {
        criteria = {
            context: 'announcement',
            keyword: 'i am yOur amonG Us',
            offset: 0,
            limit: 10,
        };

        const factory = new AnnouncementSearchResultFactory();
        const result = await factory.getAllResultJson(criteria);

        expect(result.totalResults).toBe(0);
    });
});

describe('PublicMessageSearchResultFactory', () => {
    let criteria;
    beforeEach(() => {
        jest.clearAllMocks();
        mockMessageGetAllPublicMessages.mockResolvedValueOnce([
            {
                sender: { username: 'gary' },
                timestamp: new Date(),
                content: 'FSE is my favorite course.',
                status: 'OK',
            },
            {
                sender: { username: 'gary1' },
                timestamp: new Date(),
                content: 'FSE is not my favorite course.',
                status: 'OK',
            },
            {
                sender: { username: 'gary1' },
                timestamp: new Date(),
                content: 'FSE is a good course.',
                status: 'OK',
            },
            {
                sender: { username: 'gary1' },
                timestamp: new Date(),
                content: 'FSE is a course in CMU.',
                status: 'OK',
            }
        ]);
    });

    test('search public message 1', async () => {
        criteria = {
            context: 'public-message',
            keyword: 'FsE',
            offset: 0,
            limit: 10,
        };

        const factory = new PublicMessageSearchResultFactory();
        const result = await factory.getLimitResultJson(criteria);

        expect(result.totalResults).toBe(4);
    });
    
    test('search public message 2', async () => {
        criteria = {
            context: 'public-message',
            keyword: 'FSE is our',
            offset: 0,
            limit: 10,
        };

        const factory = new PublicMessageSearchResultFactory();
        const result = await factory.getLimitResultJson(criteria);

        expect(result.totalResults).toBe(4);
    });

    test('search public message 3', async () => {
        criteria = {
            context: 'public-message',
            keyword: 'FSE favorite',
            offset: 0,
            limit: 10,
        };

        const factory = new PublicMessageSearchResultFactory();
        const result = await factory.getLimitResultJson(criteria);

        expect(result.totalResults).toBe(2);
    });
});

describe('PrivateMessageSearchResultFactory', () => {
    let criteria;
    beforeEach(() => {
        jest.clearAllMocks();

        mockUserFindUser.mockImplementation(username => Promise.resolve({ username }));
        mockMessageGetAllPrivateMessagesBetweenUsers.mockResolvedValueOnce([
            {
                sender: { username: 'gary' },
                timestamp: new Date(),
                content: 'FSE is my favorite course.',
                status: 'OK',
            },
            {
                sender: { username: 'gary' },
                timestamp: new Date(),
                content: 'FSE is not my favorite course.',
                status: 'OK',
            },
            {
                sender: { username: 'gary' },
                timestamp: new Date(),
                content: 'FSE is a good course.',
                status: 'OK',
            },
            {
                sender: { username: 'gary' },
                timestamp: new Date(),
                content: 'FSE is a course in CMU.',
                status: 'Help',
            }
        ]);
    });

    test('search private message 1', async () => {
        criteria = {
            context: 'private-message',
            keyword: 'FsE',
            offset: 0,
            limit: 10,
        };

        const factory = new PrivateMessageSearchResultFactory();
        const result = await factory.getLimitResultJson(criteria);

        expect(result.totalResults).toBe(4);
    });

    test('search private message 2', async () => {
        criteria = {
            context: 'private-message',
            keyword: 'FSE is our',
            offset: 0,
            limit: 10,
        };

        const factory = new PrivateMessageSearchResultFactory();
        const result = await factory.getLimitResultJson(criteria);

        expect(result.totalResults).toBe(4);
    });

    test('search private message 3', async () => {
        criteria = {
            context: 'private-message',
            keyword: 'FSE favorite',
            offset: 0,
            limit: 10,
        };

        const factory = new PrivateMessageSearchResultFactory();
        const result = await factory.getLimitResultJson(criteria);

        expect(result.totalResults).toBe(2);
    });

    test('search private message - special case: status', async () => {
        criteria = {
            context: 'private-message',
            keyword: 'status',
            offset: 0,
            limit: 10,
            user1: 'foo',
            user2: 'gary',
        };

        const factory = new PrivateMessageSearchResultFactory();
        const result = await factory.getLimitResultJson(criteria);

        expect(result.totalResults).toBe(2);
        expect(result.results[0].status === 'Help');
    });
});
