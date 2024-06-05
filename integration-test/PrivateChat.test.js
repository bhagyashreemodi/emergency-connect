import User from "../models/User.js";
import Message from "../models/Message.js";
import agent from 'superagent';
import App from '../config/App.js';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {afterAll, beforeAll, beforeEach, expect, test} from "@jest/globals";
import JestEnvSetup from "./JestEnvSetup.js";
import TokenUtil from "../utils/TokenUtil.js";

let mongoServer, user1, user2;
let HOST = `http://localhost:4000`;
let app;

async function setupUsers() {

    user1 = new User().setAllFields({ _id: '60f1b9b3b3b3b3b3b3b3b3b3', username: 'user1', password: 'password'});
    user2 = new User().setAllFields({ _id: 'dsfsafsadfsdfsadfsadfsfd', username: 'user2', password: 'password'});
    await user1.save();
    await user2.save();
    user1 = await User.findUser('user1');
    user2 = await User.findUser('user2');
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4000);
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

test('should send a private message', async () => {
    const messageContent = 'Hello, recipient!';

    const res = await agent.post(`${HOST}/messages/private`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send({recipientUsername: 'user2', messageContent: messageContent})

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Message sent successfully');
});


test('should get private messages between users', async () => {
    const message1 = new Message().setAllFields({sender: user1, receiver: user2, content: 'Hello, user2!', type: 'private'});
    await message1.save();
    const message2 = new Message().setAllFields({sender: user2, receiver: user1, content: 'Hello, user1!', type: 'private'});
    await message2.save();

    const res = await agent
        .get(`${HOST}/messages/private/${user1.getUsername()}/${user2.getUsername()}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    const resMessages = res.body;
    let containsUser1 = false;
    let containsUser2 = false;
    resMessages.forEach((message) => {
        containsUser1 = containsUser1 || message.username === user1.getUsername();
        containsUser2 = containsUser2 || message.username === user2.getUsername();
    });
    expect(containsUser1).toBe(true);
    expect(containsUser2).toBe(true);
});

test('should get all private messages by user', async () => {
    const message1 = new Message().setAllFields({sender: user1, receiver: user2, content: 'Hi, user2!', type: 'private'});
    await message1.save();
    const message2 = new Message().setAllFields({sender: user2, receiver: user1, content: 'Hi, user1!', type: 'private'});
    await message2.save();

    const res = await agent
        .get(`${HOST}/messages/private/${user1.getUsername()}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`);

    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
    const resMessages = res.body;
    resMessages.forEach((message) => {
        expect(message.username).toBe(user1.getUsername());
    });
});

test('should update status of read messages sent by a user', async () => {
    const message1 = new Message().setAllFields({sender: user1, receiver: user2, content: 'Hi, user2!', type: 'private'});
    await message1.save();

    const res = await agent
        .put(`${HOST}/messages/private/${user1.getUsername()}/read`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`);

    expect(res.status).toBe(200);

    const resMessages = await agent
        .get(`${HOST}/messages/private/${user1.getUsername()}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .then (res => res.body);
    resMessages.forEach((message) => {
        expect(message.isRead).toBe(true);
    });
});
