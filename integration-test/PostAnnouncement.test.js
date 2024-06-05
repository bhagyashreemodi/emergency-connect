import User from "../models/User.js";
import Announcement from "../models/Announcement.js";
import agent from 'superagent';
import App from '../config/App.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, expect, test } from "@jest/globals";
import JestEnvSetup from "./JestEnvSetup.js";
import TokenUtil from "../utils/TokenUtil.js";

let mongoServer, user;
let HOST = `http://localhost:4002`;
let app;
let dummy = {
    _id: '60f1b9b3b3b3b3b3b3b3b3b3',
    username: 'arthur',
    password: 'vwy207',
    status: 'Ok',
    privilege: 'Coordinator'
};

async function setupAnnouncements() {
    user = new User().setAllFields({ _id: dummy._id, username: dummy.username, password: dummy.password, privilege: dummy.privilege});
    await user.save();
    let newAnnouncement = new Announcement().setAllFields({
        sender: user,
        content: 'This is a test announcement',
    });
    await newAnnouncement.save();
}

beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4002);
    app = new App();
    await app.init().then(() => {
        console.log("--------------- Server Started ---------------");
    });
    await setupAnnouncements();
});

afterAll(async () => {
    await app.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
    JestEnvSetup.resetEnv();
});

test('Can retrieve an announcement via GET request', async () => {
    // Attempt to retrieve the test announcement
    await agent.get(`${HOST}/announcements`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            // Handle the response from retrieving the user's status
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            const resMessages = res.body;
            resMessages.forEach((message) => {
                expect(message.message).toBe('This is a test announcement');
            });
        })
        .catch(e => {
            // Handle any error that occurred during the retrieval
            console.error(e);
            expect(e).toBeUndefined();
        });
});

test('Can create an new announcement via POST request', async () => {
    // Attempt to update a test announcement
    let announcementContent = 'This is a test announcement';
    await agent.post(`${HOST}/announcements`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .send({announcementContent})
        .then(res => {
            // Handle the response from retrieving the user's status
            expect(res.statusCode).toBe(200);
        })
        .catch(e => {
            // Handle any error that occurred during the retrieval
            console.error(e);
            expect(e).toBeUndefined();
        });

    await agent.get(`${HOST}/announcements`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            // Handle the response from retrieving the user's status
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            const resMessages = res.body;
            expect(resMessages.length).toBe(2);
            resMessages.forEach((message) => {
                expect(message.message).toBe('This is a test announcement');
            });
        })
        .catch(e => {
            // Handle any error that occurred during the retrieval
            console.error(e);
            expect(e).toBeUndefined();
        });
});
