import { jest, describe, expect, test, beforeEach } from '@jest/globals';


const mockFindUser = jest.fn();
const mockCountActiveAdministrator = jest.fn();
const mockIsAdmin = jest.fn();
const mockIsReservedUser = jest.fn();
const mockIsUsernameTooShort = jest.fn();
const mockSocketEmit = jest.fn();
const mockGetId = jest.fn();
const mockFindUserById = jest.fn();
jest.unstable_mockModule('../models/User.js', () => ({
    default: class {
        constructor() {
            this.privilege = 'Citizen';
            this.isActive = true;
            this.isAdmin = mockIsAdmin;
            this.isUsernameTooShort = mockIsUsernameTooShort;
            this.update = jest.fn();
            this.getId = mockGetId;
        }
        static findUser = mockFindUser;
        static findUserById = mockFindUserById;
        static countActiveAdministrator = mockCountActiveAdministrator;
        static isReservedUser = mockIsReservedUser;
    }
}));
await jest.unstable_mockModule('../config/SocketioConfig.js', () => ({
    default: {
        getInstance: jest.fn(() => ({
            getIO: jest.fn(() => ({ emit: mockSocketEmit }))
        }))
    }
}));
// Dynamic import the controller after setting up the mocks
const { default: User } = await import('../models/User.js');
const { default: AdminController } = await import('../controllers/AdminController.js');

describe('AdminController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn(),
            json: jest.fn()
        };
    });

    test('should return false and error message if the last admin in the system tries to change its own privilege to non-admin', async () => {
        const user = new User();
        mockCountActiveAdministrator.mockResolvedValue(1);
        mockIsAdmin.mockReturnValue(true);
        user.privilege = 'Administrator';

        const result = await AdminController.updateUserPrivilege(user, 'Coordinator');

        expect(result.success).toBe(false);
        expect(result.message).toBe('Should have at least one active Administrator in the system');
        expect(user.privilege).toBe('Administrator');
    });

    test("should update user isActive status to false when valid input is provided", async () => {
        const user = new User();
        user.isActive = true;
        mockIsAdmin.mockReturnValue(false);

        const result = await AdminController.updateUserIsActive(user, '0');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Valid update');
        expect(user.isActive).toBe(false);
    });

    test("should update user privilege to Coordinator when valid input is provided", async () => {
        const user = new User();
        user.isActive = true;
        user.privilege = 'Citizen';
        mockIsAdmin.mockReturnValue(false);
        const result = await AdminController.updateUserPrivilege(user, 'Coordinator');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Valid update');
        expect(user.privilege).toBe('Coordinator');
    });

    test("should update user username when valid input is provided", async () => {
        const user = new User();
        user.isActive = true;
        user.privilege = 'Citizen';
        user.username = 'testuser'
        mockIsReservedUser.mockReturnValue(false);
        mockIsUsernameTooShort.mockReturnValue(false);
        const result = await AdminController.updateUserUsername(user, 'newtestuser');

        expect(result.success).toBe(true);
        expect(result.message).toBe('Valid update');
        expect(user.username).toBe('newtestuser');
        expect(user.privilege).toBe('Citizen');
    });

    test("should not update a field if it is not permitted", async () => {
        const user = new User();
        user.username = 'testuser';
        user.isActive = true;
        user.privilege = 'Citizen';
        user.status = 'OK';
        user._id = 'testuser';
        mockFindUser.mockResolvedValue(user);
        mockFindUserById.mockResolvedValue(user);

        const req = {
            body: {status: 'Emergency'},
            params: { username: 'testuser' }
        };
        let adminController = new AdminController();
        await adminController.updateUser(req, res);

        expect(user.username).toBe('testuser');
        expect(user.isActive).toBe(true);
        expect(user.privilege).toBe('Citizen');
    });
});