import User from "../models/User.js";
import agent from 'superagent';
import App from '../config/App.js';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {afterAll, beforeAll, beforeEach, expect, test} from "@jest/globals";
import JestEnvSetup from "./JestEnvSetup.js";
import TokenUtil from "../utils/TokenUtil.js";
import ResourceRequestPost from "../models/ResourceRequestPost.js";

let mongoServer, user1, user2;
let testPostData1;
let HOST = `http://localhost:4101`;
let app;

async function setupUsers() {
    user1 = new User().setAllFields({ _id: '60f1b9b3b3b3b3b3b3b3b3b3', username: 'user1', password: 'password' });
    user2 = new User().setAllFields({ _id: 'dsfsafsadfsdfsadfsadfsfd', username: 'user2', password: 'password' });
    await user1.save();
    await user2.save();
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4101);
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

beforeEach(() => {
    testPostData1 = {
        title: "Test Title",
        description: "test test test",
        address: "CMU-SV, B23 NASA Park, CA",
        email: "example@cmu.edu",
        requestedItems: ["item1", "item2", "item3"]
    };
});

test('should get a request by id', async () => {
    testPostData1.sender = user1;
    const post = new ResourceRequestPost().setAllFields(testPostData1);
    await post.save();
    const postId = post._id;

    let res = await agent.get(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(testPostData1.title);
    expect(res.body.username).toBe(user1.getUsername());
});

test('should get all requests', async () => {
    let res = await agent.get(`${HOST}/resource-requests/`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();
    expect(res.status).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
});

test('should post a request', async () => {
    let res;

    res = await agent.get(`${HOST}/resource-requests`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();
    const originalCount = res.body.length;

    res = await agent.post(`${HOST}/resource-requests`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send({formData: testPostData1});
    expect(res.status).toBe(200);

    res = await agent.get(`${HOST}/resource-requests`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(originalCount + 1);
});

test('should edit a request', async () => {
    let res;

    testPostData1.sender = user1;
    const post = new ResourceRequestPost().setAllFields(testPostData1);
    await post.save();
    const postId = post._id;
    testPostData1.title = "Edited Test Title";

    res = await agent.put(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send({formData: testPostData1});
    expect(res.status).toBe(200);

    res = await agent.get(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Edited Test Title");
});

test('should not allow to edit a request', async () => {
    testPostData1.sender = user1;
    const post = new ResourceRequestPost().setAllFields(testPostData1);
    await post.save();
    const postId = post._id;
    testPostData1.title = "Edited Test Title";

    await agent.put(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)
        .send({formData: testPostData1})
        .catch(e => expect(e.status).toBe(403));
});

test('should delete a request', async () => {
    let res;

    testPostData1.sender = user1;
    const post = new ResourceRequestPost().setAllFields(testPostData1);
    await post.save();
    const postId = post._id;

    res = await agent.get(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)
        .send();
    expect(res.status).toBe(200);

    res = await agent.delete(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send();
    expect(res.status).toBe(200);

    await agent.get(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)
        .send()
        .catch(e => expect(e.status).toBe(404));
});

test('should not allow to delete a request', async () => {
    testPostData1.sender = user1;
    const post = new ResourceRequestPost().setAllFields(testPostData1);
    await post.save();
    const postId = post._id;

    await agent.delete(`${HOST}/resource-requests/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)
        .send()
        .catch(e => expect(e.status).toBe(403));
});

test('should add a new provider to a request', async () => {
    testPostData1.sender = user1;
    const post = new ResourceRequestPost().setAllFields(testPostData1);
    await post.save();
    const postId = post._id;

    const formData = {
        message: 'I can help you.',
        email: 'example@link.cuhk.edu.cn',
        skipEmailNotification: true,
    }
    await agent.put(`${HOST}/resource-requests/${postId}/provider`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)
        .send({formData: formData});

    const postUpdated = await ResourceRequestPost.getPostById(postId);
    expect(postUpdated.providers.length).toBe(1);
});

test('should not allow to add a new provider to a request', async () => {
    testPostData1.sender = user1;
    const post = new ResourceRequestPost().setAllFields(testPostData1);
    await post.save();
    const postId = post._id;

    const formData = {
        message: 'I can help you.',
        email: 'example@link.cuhk.edu.cn',
        skipEmailNotification: true,
    }
    await agent.put(`${HOST}/resource-requests/${postId}/provider`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send({formData: formData})
        .catch(e => expect(e.status).toBe(403));
});
