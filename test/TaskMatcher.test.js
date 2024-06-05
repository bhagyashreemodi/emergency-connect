import {expect, jest, test} from "@jest/globals";

const mockGetAvailableVolunteers = jest.fn();
const mockSendSMSNotification = jest.fn();
const mockSocketEmit = jest.fn();
await jest.unstable_mockModule("../models/Volunteer.js", () => ({
    default: class Volunteer {
        static getAvailableVolunteers= mockGetAvailableVolunteers
    }
}));
await jest.unstable_mockModule("../utils/SMSSubscriber.js", () => ({
    default: class SMSSubscriber {
        static sendSMSNotification= mockSendSMSNotification
    }
}));
await jest.unstable_mockModule('../config/SocketioConfig.js', () => ({
    default: {
        getInstance: jest.fn(() => ({
            getSocketIdsByUsername: jest.fn(() => ['socketId1', 'socketId2']),
            getIO: jest.fn(() => ({ to: jest.fn(() => ({ emit: mockSocketEmit })) }))
        }))
    }
}));

const { default: TaskMatcher } = await import("../utils/TaskMatcher.js");

test("should notify the volunteers with SMS consent set as true ", async () => {
    const task = {
        zipCode: "94089",
        city: "Sunnyvale",
        state: "California",
        skill: "test"
    };
    const volunteer = {
        firstName: "John",
        phoneNumber: "1234567890",
        consent: true,
        username: "john"
    };
    mockGetAvailableVolunteers.mockResolvedValue([volunteer]);

    await TaskMatcher.matchTasksWithVolunteers(task);

    expect(mockGetAvailableVolunteers).toHaveBeenCalledWith(task.zipCode, task.city, task.state, expect.any(String), task.skill);
    expect(mockSendSMSNotification).toHaveBeenCalledWith(volunteer.firstName, volunteer.phoneNumber, task);
});

test("should not notify the volunteers with SMS consent set as false ", async () => {
    const task = {
        zipCode: "94089",
        city: "Sunnyvale",
        state: "California",
        skill: "test"
    };
    const volunteer = {
        firstName: "John",
        phoneNumber: "1234567890",
        consent: false,
        username: "john"
    };
    mockGetAvailableVolunteers.mockResolvedValue([volunteer]);

    await TaskMatcher.matchTasksWithVolunteers(task);

    expect(mockGetAvailableVolunteers).toHaveBeenCalledWith(task.zipCode, task.city, task.state, expect.any(String), task.skill);
    expect(mockSendSMSNotification).not.toHaveBeenCalledWith(volunteer.firstName, volunteer.phoneNumber, task);
});
