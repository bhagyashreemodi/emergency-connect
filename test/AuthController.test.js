import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { BAD_REQUEST, CREATED, FORBIDDEN, NOT_FOUND, OK, UNAUTHORIZED, INTERNAL_SERVER_ERROR } from "../utils/HttpStatus.js";

// Mock models and utilities
const mockFindUser = jest.fn();
const mockSave = jest.fn();
const mockSetOnlineStatus = jest.fn();
const mockIsPasswordCorrect = jest.fn();
const mockSetAgreement = jest.fn();
const mockGetAllUsers = jest.fn();
const mockRetrieveAllPrivateMessagesBetweenUsers = jest.fn();
const mockSign = jest.fn();
const mockSetAllFields = jest.fn();
const mockGetUsername = jest.fn();
const mockIsUsernameTooShort = jest.fn();
const mockIsPasswordTooShort = jest.fn();
const mockGetId = jest.fn();
const mockIsAdmin = jest.fn();

jest.unstable_mockModule('../models/User.js', () => ({
    default: class {
        constructor() {
            this.save = mockSave;
            this.setOnlineStatus = mockSetOnlineStatus;
            this.isPasswordCorrect = mockIsPasswordCorrect;
            this.setAgreement = mockSetAgreement;
            this.setAllFields = mockSetAllFields;
            this.getUsername = mockGetUsername;
            this.isUsernameTooShort = mockIsUsernameTooShort;
            this.isPasswordTooShort = mockIsPasswordTooShort;
            this.getId = mockGetId;
            this.isAdmin = mockIsAdmin;
        }
        static findUser = mockFindUser;
        static getAllUsers = mockGetAllUsers;
        static isReservedUser = jest.fn();
    }
}));

jest.unstable_mockModule('../models/Message.js', () => ({
    default: {
        retrieveAllPrivateMessagesBetweenUsers: mockRetrieveAllPrivateMessagesBetweenUsers
    }
}));

jest.unstable_mockModule('../models/ReponseBody.js', () => ({
  default: class {
      constructor() {
          this.message = '';
          this.success = false;
      }
      setMessage = jest.fn(function (message) {
          this.message = message;
          return this;
      });
      buildGetUserResponse = jest.fn().mockReturnValue({ some: 'data' });
      buildLoginSuccessResponse = jest.fn().mockReturnValue({ token: 'token' });
      buildUserCreatedResponse = jest.fn().mockReturnValue({ token: 'token' });
  }
}));

jest.mock('jsonwebtoken', () => ({
    sign: mockSign
}));

// Dynamic import the controller after setting up the mocks
const { default: AuthController } = await import('../controllers/AuthController.js');

describe('AuthController', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        res = {
            status: jest.fn(() => res),
            send: jest.fn(),
            json: jest.fn()
        };
    });

    test('register - Success', async () => {
        req = {
            body: {
                username: 'newuser',
                password: 'password'
            }
        };
        mockFindUser.mockResolvedValueOnce(null);
        mockSetAllFields.mockReturnValueOnce({
            save: mockSave,
            getUsername: mockGetUsername.mockReturnValueOnce('newuser'),
            isUsernameTooShort: mockIsUsernameTooShort.mockReturnValueOnce(false),
            isPasswordTooShort: mockIsPasswordTooShort.mockReturnValueOnce(false)
        });
        const controller = new AuthController();
        await controller.register(req, res);
        expect(mockSave).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(CREATED);
        expect(res.send).toHaveBeenCalledWith('Store user data in database');
    });

    test('getUser - User not found', async () => {
        req = {
            params: {
                username: 'nonexistentUser'
            }
        };
        mockFindUser.mockResolvedValueOnce(null);
        const controller = new AuthController();
        await controller.getUser(req, res);
        expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found' }));
    });

    test('login - Success', async () => {
      req = {
          body: {
              username: 'validuser',
              password: 'password'
          }
      };
      const user = {
          getId: jest.fn().mockReturnValueOnce('validuser'),
          isActive: true,
          isAgree: true,
          setOnlineStatus: mockSetOnlineStatus,
          isPasswordCorrect: mockIsPasswordCorrect.mockResolvedValueOnce(true)
      };
      mockFindUser.mockResolvedValueOnce(user);
      mockSign.mockReturnValueOnce('token');
      const controller = new AuthController();
      await controller.login(req, res);
      expect(mockSetOnlineStatus).toHaveBeenCalledWith(true);
      expect(res.status).toHaveBeenCalledWith(OK);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ token: 'token' }));
    });

    test('login - User not found', async () => {
      req = {
          body: {
              username: 'nonexistentUser',
              password: 'password'
          }
      };
      mockFindUser.mockResolvedValueOnce(null);
      const controller = new AuthController();
      await controller.login(req, res);
      expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found' }));
    });

    test('login - Incorrect password', async () => {
      req = {
          body: {
              username: 'validuser',
              password: 'incorrectPassword'
          }
      };
      const user = {
          getUsername: jest.fn().mockReturnValueOnce('validuser'),
          isActive: true,
          isAgree: true,
          isPasswordCorrect: mockIsPasswordCorrect.mockResolvedValueOnce(false)
      };
      mockFindUser.mockResolvedValueOnce(user);
      const controller = new AuthController();
      await controller.login(req, res);
      expect(res.status).toHaveBeenCalledWith(BAD_REQUEST);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Wrong password' }));
  });

    test('logout - Success', async () => {
      req = {
          params: {
              username: 'validuser'
          }
      };
      const user = {
          setOnlineStatus: mockSetOnlineStatus
      };
      mockFindUser.mockResolvedValueOnce(user);
      const controller = new AuthController();
      await controller.logout(req, res);
      expect(mockSetOnlineStatus).toHaveBeenCalledWith(false);
      expect(res.status).toHaveBeenCalledWith(OK);
      expect(res.send).toHaveBeenCalledWith('Logged out successfully');
  });

  test('getAllUsers - Success', async () => {
      const mockUserIsAdmin = jest.fn();
      req = {
          user: {
              username: 'clientUser',
              isAdmin: mockUserIsAdmin,
          }
      };
      const users = [
          { username: 'user1', isOnline: true, status: 'Help', isActive: true },
          { username: 'user2', isOnline: false, status: 'Emergency', isActive: true }
      ];
      mockUserIsAdmin.mockResolvedValueOnce(true);
      mockGetAllUsers.mockResolvedValueOnce(users);
      mockRetrieveAllPrivateMessagesBetweenUsers.mockResolvedValue([]);
      const controller = new AuthController();
      await controller.getAllUsers(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
          expect.objectContaining({
              username: 'user1',
              isOnline: true,
              status: 'Help',
              chatted: false,
              unread: 0,
              lastMessage: ''
          }),
          expect.objectContaining({
              username: 'user2',
              isOnline: false,
              status: 'Emergency',
              chatted: false,
              unread: 0,
              lastMessage: ''
          })
      ]));
    });

    test('agreeToTerms - Success', async () => {
        req = {
            params: {
                username: 'validuser'
            }
        };
        const user = {
            getId: jest.fn().mockReturnValueOnce('validuser'),
            setAgreement: mockSetAgreement
        };
        mockFindUser.mockResolvedValueOnce(user);
        mockSign.mockReturnValueOnce('token');
        const controller = new AuthController();
        await controller.agreeToTerms(req, res);
        expect(mockSetAgreement).toHaveBeenCalledWith(true);
        expect(res.status).toHaveBeenCalledWith(OK);
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ token: 'token' }));
    });

    test('Inactive users information is not shown on esn directory to non-administrator user', async () => {
        const mockUserIsAdmin = jest.fn();
        req = {
            user: {
                username: 'clientUser',
                isAdmin: mockUserIsAdmin,
            }
        };
        const users = [
            { username: 'user1', isOnline: true, status: 'Help', isActive: true },
            { username: 'user2', isOnline: false, status: 'Emergency', isActive: false }
        ];
        mockUserIsAdmin.mockResolvedValueOnce(false);
        mockGetAllUsers.mockResolvedValueOnce(users);

        const controller = new AuthController();
        await controller.getAllUsers(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                username: 'user1',
                isOnline: true,
                status: 'Help',
                chatted: false,
                unread: 0,
                lastMessage: ''
            }),
        ]));
    });

    test('Inactive users information is shown on esn directory to administrator user', async () => {
        const mockUserIsAdmin = jest.fn();
        req = {
            user: {
                username: 'clientUser',
                isAdmin: mockUserIsAdmin,
            }
        };
        const users = [
            { username: 'user1', isOnline: true, status: 'Help', isActive: true },
            { username: 'user2', isOnline: false, status: 'Emergency', isActive: false }
        ];
        mockUserIsAdmin.mockResolvedValueOnce(true);
        mockGetAllUsers.mockResolvedValueOnce(users);

        const controller = new AuthController();
        await controller.getAllUsers(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                username: 'user1',
                isOnline: true,
                status: 'Help',
                chatted: false,
                unread: 0,
                lastMessage: ''
            }),
            expect.objectContaining({
                username: 'user2',
                isOnline: false,
                status: 'Emergency',
                chatted: false,
                unread: 0,
                lastMessage: ''
            })
        ]));
    });

});