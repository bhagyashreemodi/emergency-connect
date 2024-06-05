import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND, OK, CREATED } from "../utils/HttpStatus.js";

// Mock models and utilities
const mockGetAllIncidents = jest.fn();
const mockSaveIncident = jest.fn();
const mockDeleteIncidentById = jest.fn();
const mockUpdateIncident = jest.fn();
const mockFindUser = jest.fn();

jest.unstable_mockModule('../models/Incident.js', () => ({
  default: class {
    setAllFields = jest.fn();
    saveIncident = mockSaveIncident;
    toResJson = jest.fn().mockImplementation(() => ({ some: 'data' }));
    static getAllIncidents = mockGetAllIncidents;
    static deleteIncidentById = mockDeleteIncidentById;
    static updateIncident = mockUpdateIncident;
  }
}));

jest.unstable_mockModule('../models/User.js', () => ({
  default: {
    findUser: mockFindUser
  }
}));

// Dynamic import the controller after setting up the mocks
const { default: IncidentController } = await import('../controllers/IncidentController.js');

describe('IncidentController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = { status: jest.fn(() => res), send: jest.fn() };
  });

  test('getAllIncidents - Success', async () => {
    const incidents = [{ type: 'Test Incident', description: 'Test description' }];
    mockGetAllIncidents.mockResolvedValueOnce(incidents);

    const controller = new IncidentController();
    await controller.getAllIncidents(req, res);

    expect(res.status).toHaveBeenCalledWith(OK);
    expect(res.send).toHaveBeenCalledWith(incidents);
  });

  test('getAllIncidents - Error', async () => {
    const error = new Error('Internal Server Error');
    mockGetAllIncidents.mockRejectedValueOnce(error);

    const controller = new IncidentController();
    await controller.getAllIncidents(req, res);

    expect(res.status).toHaveBeenCalledWith(INTERNAL_SERVER_ERROR);
    expect(res.send).toHaveBeenCalledWith({ message: 'Internal Server Error' });
  });

  test('createIncident - Missing required fields', async () => {
    req = { body: {} };
    const controller = new IncidentController();
    await controller.createIncident(req, res);

    expect(res.status).toHaveBeenCalledWith(BAD_REQUEST);
    expect(res.send).toHaveBeenCalledWith({ message: 'Missing required fields' });
  });

  test('createIncident - User not found', async () => {
    req = {
      body: {
        type: 'Test Incident',
        description: 'Test description',
        location: 'Test location',
        status: 'Active',
        severity: 'Low'
      },
      user: { username: 'nonexistentUser' }
    };
    mockFindUser.mockResolvedValueOnce(null);

    const controller = new IncidentController();
    await controller.createIncident(req, res);

    expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'User not found' }));
  });

  test('createIncident - Success', async () => {
    req = {
      body: {
        type: 'Test Incident',
        description: 'Test description',
        location: 'Test location',
        status: 'Active',
        severity: 'Low'
      },
      user: { username: 'validUser' }
    };
    mockFindUser.mockResolvedValueOnce({ username: 'validUser' });

    const controller = new IncidentController();
    await controller.createIncident(req, res);

    expect(mockSaveIncident).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(CREATED);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Incident created successfully' }));
  });

  test('deleteIncident - Success', async () => {
    req = { params: { _id: '123' } };
    mockDeleteIncidentById.mockResolvedValueOnce({ _id: '123' });

    const controller = new IncidentController();
    await controller.deleteIncident(req, res);

    expect(res.status).toHaveBeenCalledWith(OK);
    expect(res.send).toHaveBeenCalledWith({ message: 'Incident deleted successfully' });
  });

  test('deleteIncident - Incident not found', async () => {
    req = { params: { _id: '123' } };
    mockDeleteIncidentById.mockResolvedValueOnce(null);

    const controller = new IncidentController();
    await controller.deleteIncident(req, res);

    expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
    expect(res.send).toHaveBeenCalledWith({ message: 'Incident not found' });
  });

  test('updateIncident - Incident not found', async () => {
    req = {
      params: { _id: '123' },
      body: {
        type: 'Updated Incident',
        description: 'Updated description',
        status: 'Resolved',
        severity: 'High'
      },
      user: { username: 'validUser' }
    };
    mockFindUser.mockResolvedValueOnce({ username: 'validUser' });
    mockUpdateIncident.mockResolvedValueOnce(null);

    const controller = new IncidentController();
    await controller.updateIncident(req, res);

    expect(res.status).toHaveBeenCalledWith(NOT_FOUND);
    expect(res.send).toHaveBeenCalledWith({ message: 'Incident not found' });
  });

  test('updateIncident - Success', async () => {
    req = {
      params: { _id: '123' },
      body: {
        type: 'Updated Incident',
        description: 'Updated description',
        status: 'Resolved',
        severity: 'High'
      },
      user: { username: 'validUser' }
    };
    mockFindUser.mockResolvedValueOnce({ username: 'validUser' });
    mockUpdateIncident.mockResolvedValueOnce({ _id: '123', type: 'Updated Incident', description: 'Updated description', status: 'Closed', severity: 'High' });

    const controller = new IncidentController();
    await controller.updateIncident(req, res);

    expect(res.status).toHaveBeenCalledWith(OK);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ message: 'Incident updated successfully!' }));
  });

  test('updateIncident - Invalid update', async () => {
    req = {
      params: { _id: '123' },
      body: {
        invalidField: 'Invalid value'
      },
      user: { username: 'validUser' }
    };
    mockFindUser.mockResolvedValueOnce({ username: 'validUser' });

    const controller = new IncidentController();
    await controller.updateIncident(req, res);

    expect(mockUpdateIncident).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(BAD_REQUEST);
    expect(res.send).toHaveBeenCalledWith({ message: 'Invalid update fields' });
  });
});