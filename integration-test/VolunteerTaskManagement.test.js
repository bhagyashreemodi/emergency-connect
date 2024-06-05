import agent from 'superagent';
import App from '../config/App.js';
import {MongoMemoryServer} from 'mongodb-memory-server';
import JestEnvSetup from "./JestEnvSetup.js";
import {afterAll, beforeAll, beforeEach, expect, test} from "@jest/globals";
import User from "../models/User.js";
import Volunteer from "../models/Volunteer.js";
import TokenUtil from "../utils/TokenUtil.js";

let mongoServer, user1, user2, volunteer2;
let HOST = `http://localhost:4004`;
let app;

async function setupUsers() {

    user1 = new User().setAllFields({ _id: '60f1b9b3b3b3b3b3b3b3b3b3', username: 'user1', password: 'password' });
    user2 = new User().setAllFields({ _id: 'dsfsafsadfsdfsadfsadfsfd', username: 'user2', password: 'password' });
    await user1.save();
    await user2.save();
    user1 = await User.findUser('user1');
    user2 = await User.findUser('user2');
    volunteer2 = new Volunteer('user2', 'test', 'test', 'test', 'test', '94089', ['test'], '123-345-4567', ['Monday'], false);
    await volunteer2.saveVolunteerProfile();
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4004);
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

test('should create a new task in the system for volunteers', async () => {
    const res = await agent.post(`${HOST}/volunteers/tasks`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send({ title: 'test', helpMessage: 'test', description: 'test', fullAddress: 'test', city: 'test', state: 'test', zipCode: '94089', skill: 'test', status: 'OPEN' });

    expect(res.status).toBe(201);

    const response = await agent.get(`${HOST}/volunteers/tasks/OPEN`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`);

    expect(response.status).toBe(200);
    expect(response.body[0].title).toBe('test');
});

test('should update the status to accepted after a volunteer accepts a task', async () => {
    const res = await agent.put(`${HOST}/volunteers/user2/tasks/test/ACCEPTED`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)

    expect(res.status).toBe(200);

    const response = await agent.get(`${HOST}/volunteers/user2/tasks`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`);

    expect(response.status).toBe(200);
    expect(response.body[0].title).toBe('test');
    expect(response.body[0].status).toBe('ACCEPTED');
    expect(response.body[0].assignee).toBe('user2');
});

test('should update the status to declined after a volunteer declines a task', async () => {
    const res = await agent.put(`${HOST}/volunteers/user2/tasks/test/DECLINED`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)

    expect(res.status).toBe(200);

    const response = await agent.get(`${HOST}/volunteers/user2/tasks`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`);

    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([]);
});

test('should throw an error if a non-volunteer user tries to retrieve tasks', async () => {
    try {
        const response  = await agent.get(`${HOST}/volunteers/tasks/OPEN`)
            .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
    } catch (error) {
        expect(error).toBeDefined();
        expect(error.status).toBe(404);
        expect(error.response.body.message).toBe('Volunteer not found');
    }
});

