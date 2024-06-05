import User from "../models/User.js";
import Message from "../models/Message.js";
import agent from 'superagent';
import App from '../config/App.js';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {afterAll, beforeAll, beforeEach, expect, test} from "@jest/globals";
import JestEnvSetup from "./JestEnvSetup.js";
import TokenUtil from "../utils/TokenUtil.js";

let mongoServer, user1, user2;
let HOST = `http://localhost:4100`;
let app;

async function setupUsers() {
    user1 = new User().setAllFields({ _id: '60f1b9b3b3b3b3b3b3b3b3b3', username: 'user1', password: 'password' });
    user2 = new User().setAllFields({ _id: 'dsfsafsadfsdfsadfsadfsfd', username: 'user2', password: 'password' });
    await user1.save();
    await user2.save();
    await user1.setUserStatus('OK');
    await user2.setUserStatus('Help');
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4100);
    app = new App();
    await app.init().then(() => {
        console.log("--------------- Server Started ---------------");
    });
    await setupUsers();
});

afterAll(async () => {
    await app.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
    JestEnvSetup.resetEnv();
});

test('should search user by status', async () => {
    const res = await agent.get(`${HOST}/entities?context=user&status=Help`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();

    expect(res.status).toBe(200);
    expect(res.body.totalResults).toBe(1);
    expect(res.body.results[0].status).toBe('Help');
});

test('should search user by name', async () => {
    const res = await agent.get(`${HOST}/entities?context=user&keyword=user`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();

    expect(res.status).toBe(200);
    expect(res.body.totalResults).toBe(2);
});

test('should search private message', async () => {
    const message1 = new Message().setAllFields({sender: user1, receiver: user2, content: 'Hello, FSE!', type: 'private'});
    await message1.save();
    const message2 = new Message().setAllFields({sender: user2, receiver: user1, content: 'Hello, CMU!', type: 'private'});
    await message2.save();

    const res = await agent.get(`${HOST}/entities?context=private-message&keyword=CMU&offset=0&limit=10&user1=user1&user2=user2`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();

    expect(res.status).toBe(200);
    expect(res.body.totalResults).toBe(1);
});
