import User from "../models/User.js";
import agent from 'superagent';
import App from '../config/App.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {afterAll, beforeAll, beforeEach, expect, test} from "@jest/globals";
import JestEnvSetup from "./JestEnvSetup.js";
import TokenUtil from "../utils/TokenUtil.js";

let mongoServer;
let HOST = `http://localhost:4001`;
let app;
let dummy = { _id: '60f1b9b3b3b3b3b3b3b3b3b3', username: 'arthur', password: 'vwy207', status: 'OK' };
let user;

beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4001);
    app = new App();
    await app.init().then(() => {
        console.log("--------------- Server Started ---------------");
    });
    user = new User().setAllFields(dummy);
    await user.save();

});

beforeEach(async () => {
    await user.setUserStatus('Ok');
});

afterAll(async () => {
    await app.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
    JestEnvSetup.resetEnv();
});

test('Can update a user status via PUT request', async () => {
    // Attempt to update the user's status
    await agent.put(`${HOST}/users/${dummy.username}/status/Help`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .send()
        .then(res => {
            // Handle the response from updating the user's status
            expect(res.statusCode).toBe(200);
            let responseBody = res.body;
            expect(responseBody.success).toBe(true);
            expect(responseBody.message).toBe('Status updated successfully!');
        })
        .catch(e => {
            // Handle any error that occurred during the update
            console.error(e);
            expect(e).toBeUndefined();
        });
    
    // Verify that the user's status was updated
    await agent.get(`${HOST}/users/${dummy.username}/status`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            // Handle the response from retrieving the user's status
            expect(res.statusCode).toBe(200);
            let responseBody = res.body;
            expect(responseBody.success).toBe(true);
            expect(responseBody.message).toBe('Status retrieved successfully!');
            expect(responseBody.user.username).toBe(dummy.username);
            expect(responseBody.user.status).toBe('Help');
        })
        .catch(e => {
            // Handle any error that occurred during the retrieval
            console.error(e);
            expect(e).toBeUndefined();
        });
});

test('Can retrieve a user status via GET request', async () => {
    // Attempt to retrieve the user's status
    await agent.get(`${HOST}/users/${dummy.username}/status`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            // Handle the response from retrieving the user's status
            expect(res.statusCode).toBe(200);
            let responseBody = res.body;
            expect(responseBody.success).toBe(true);
            expect(responseBody.message).toBe('Status retrieved successfully!');
            expect(responseBody.user.username).toBe(dummy.username);
            expect(responseBody.user.status).toBe('Ok');
        })
        .catch(e => {
            // Handle any error that occurred during the retrieval
            console.error(e);
            expect(e).toBeUndefined();
        });
});
