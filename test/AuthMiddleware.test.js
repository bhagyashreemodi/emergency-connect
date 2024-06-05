import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import TokenUtil from "../utils/TokenUtil.js";
import {FORBIDDEN} from "../utils/HttpStatus.js";

const mockFindUser = jest.fn();
const mockFindUserById = jest.fn();
jest.unstable_mockModule('../models/User.js', () => ({
    default: class {
        constructor() {
        }
        static findUser = mockFindUser;
        static findUserById = mockFindUserById;
    }
}));
const { default: User } = await import('../models/User.js');
const { default: AuthMiddleware } = await import('../middlewares/AuthMiddleware.js');

test('Citizen privileged users should have access to general pages', async () => {
    try {
        const {user, token } = getMockedUser();
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockResFn() });
        const res = { status: mockResFn, send: mockResFn, redirect: mockResFn };
        const next = jest.fn();

        await AuthMiddleware.isAccessGranted(req, res, next);
        // next called meaning the user is allowed Access
        expect(next).toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

test('Coordinator privileged users should have access to general pages', async () => {
    try {
        const {user, token } = getMockedUser();
        user.privilege = 'Coordinator';
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        const mockRedirectFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockRedirectFn });
        const res = { status: mockResFn, send: mockResFn, redirect: mockRedirectFn };
        const next = jest.fn();

        await AuthMiddleware.isAccessGranted(req, res, next);
        // next called meaning the user is allowed Access
        expect(next).toHaveBeenCalled();
        expect(mockRedirectFn).not.toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

test('Citizen privileged users should not have access to announcement resources', async () => {
    try {
        const {user, token } = getMockedUser();
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockResFn() });
        const res = { status: mockResFn, send: mockResFn, redirect: mockResFn };
        const next = jest.fn();

        await AuthMiddleware.isCoordinatorOrAbove(req, res, next);

        expect(res.status).toHaveBeenCalledWith(FORBIDDEN);
        expect(res.send).toHaveBeenCalledWith({ message: 'authentication error - required privilege level: Coordinator or Administrator' });
        expect(next).not.toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

test('Coordinator privileged users should have access to announcement resources', async () => {
    try {
        const {user, token } = getMockedUser();
        user.privilege = 'Coordinator';
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        const mockRedirectFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockRedirectFn });
        const res = { status: mockResFn, send: mockResFn, redirect: mockRedirectFn };
        const next = jest.fn();

        await AuthMiddleware.isCoordinatorOrAbove(req, res, next);

        expect(mockRedirectFn).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

test('Administrator privileged users should be allowed access to all resources', async () => {
    try {
        const {user, token } = getMockedUser();
        user.privilege = 'Administrator';
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        const mockRedirectFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockRedirectFn });
        const res = { status: mockResFn, send: mockResFn, redirect: mockRedirectFn };
        const next = jest.fn();

        await AuthMiddleware.isCoordinatorOrAbove(req, res, next);

        expect(mockRedirectFn).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

test('Administrator privileged users should be allowed access to admin specific resources', async () => {
    try {
        const {user, token } = getMockedUser();
        user.privilege = 'Administrator';
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        const mockRedirectFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockRedirectFn });
        const res = { status: mockResFn, send: mockResFn, redirect: mockRedirectFn };
        const next = jest.fn();

        await AuthMiddleware.isAdmin(req, res, next);

        expect(mockRedirectFn).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

test('Coordinator privileged users should not be allowed access to admin resources', async () => {
    try {
        const {user, token } = getMockedUser();
        user.privilege = 'Coordinator';
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        const mockRedirectFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockRedirectFn });
        const res = { status: mockResFn, send: mockResFn, redirect: mockRedirectFn };
        const next = jest.fn();

        await AuthMiddleware.isAdmin(req, res, next);

        expect(res.status).toHaveBeenCalledWith(FORBIDDEN);
        expect(res.send).toHaveBeenCalledWith({ message: 'authentication error - required privilege level: Administrator' });
        expect(next).not.toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

/*------------------- Active/InActive Rule -------------------*/

test('Inactive users should not have access to any resources', async () => {
    try {
        const {user, token } = getMockedUser();
        user.isActive = false;
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        const mockRedirectFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockRedirectFn });
        const res = { status: mockResFn, send: mockResFn, redirect: mockRedirectFn };
        const next = jest.fn();

        await AuthMiddleware.isAccessGranted(req, res, next);
        // next called meaning the user is allowed Access
        expect(res.status).toHaveBeenCalledWith(FORBIDDEN);
        expect(res.send).toHaveBeenCalledWith({ message: 'authentication error - user inactive' });
        expect(next).not.toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});

test('Active users should have access to any resources', async () => {
    try {
        const {user, token } = getMockedUser();
        user.isActive = true;
        const req = { cookies: { token: token }, get: jest.fn()};
        const mockResFn = jest.fn();
        const mockRedirectFn = jest.fn();
        mockResFn.mockReturnValue({ status: mockResFn, send: mockResFn, redirect: mockRedirectFn });
        const res = { status: mockResFn, send: mockResFn, redirect: mockRedirectFn };
        const next = jest.fn();

        await AuthMiddleware.isAccessGranted(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(mockRedirectFn).not.toHaveBeenCalled();
    } catch(err) {
        console.error(err);
        throw err;
    }
});



function getMockedUser() {
    const user = new User();
    user.privilege = 'Citizen';
    user.username = 'testuser';
    user.isActive = true;
    user._id = 'testuser';
    const token = TokenUtil.generateToken(user.username);
    mockFindUser.mockResolvedValue(user);
    mockFindUserById.mockResolvedValue(user);
    return { user, token };
}