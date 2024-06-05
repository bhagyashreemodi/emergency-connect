import agent from 'superagent';
import App from '../config/App.js';
import {MongoMemoryServer} from 'mongodb-memory-server';
import JestEnvSetup from "./JestEnvSetup.js";
import {afterAll, beforeAll, beforeEach, expect, test} from "@jest/globals";
import User from "../models/User.js";
import Volunteer from "../models/Volunteer.js";
import TokenUtil from "../utils/TokenUtil.js";

let mongoServer, user1, user2, volunteer2;
let HOST = `http://localhost:4103`;
let app;

async function setupUsers() {

    user1 = new User().setAllFields({ _id: '60f1b9b3b3b3b3b3b3b3b3b3', username: 'user1', password: 'password' });
    user2 = new User().setAllFields({ _id: 'dsfsafsadfsdfsadfsadfsfd', username: 'user2', password: 'password' });
    await user1.save();
    await user2.save();
    user1 = await User.findUser('user1');
    user2 = await User.findUser('user2');
    volunteer2 = new Volunteer("user2", "test", "test", "test", "test", "94089", ["test"], "123-345-4567", ["Monday"], true);
    await volunteer2.saveVolunteerProfile();
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4103);
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

test('should register a new volunteer profile', async () => {
    const res = await agent.post(`${HOST}/volunteers`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send({username: 'user1', firstName: 'test', lastName: 'test', city: 'test', state: 'test', zipCode: '94089', skills: ['test'], phoneNumber: '123-345-4567', availability: ['Monday'], consent: true});

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Volunteer profile created successfully!');

    const response = await agent.get(`${HOST}/volunteers/user1`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`);

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe('test');
    expect(response.body.lastName).toBe('test');
});

test('should return error response if the volunteer is already registered', async () => {
    agent.post(`${HOST}/volunteers`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)
        .send({username: 'user2', firstName: 'test', lastName: 'test', city: 'test', state: 'test', zipCode: '94089', skills: ['test'], phoneNumber: '123-345-4567', availability: ['Monday'], consent: true})
        .then((res) => {
            fail('Should not have been able to register the volunteer profile');
        })
        .catch(e => {
            expect(e).toBeDefined();
        });

});

test('should update the SMS consent in the profile of the existing volunteer', async () => {
    const res = await agent.put(`${HOST}/volunteers`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`)
        .send({username: 'user2', firstName: 'test', lastName: 'test', city: 'test', state: 'test', zipCode: '94089', skills: ['test'], phoneNumber: '123-345-4567', availability: ['Monday'], consent: false});

    expect(res.status).toBe(200);

    const response = await agent.get(`${HOST}/volunteers/user2`)
        .set('Cookie', `token=${TokenUtil.generateToken(user2.getId())}`);

    expect(response.status).toBe(200);
    expect(response.body.firstName).toBe('test');
    expect(response.body.lastName).toBe('test');
    expect(response.body.consent).toBe(false);
});

test('should delete the volunteer profile', async () => {
    const volunteer1 = new Volunteer("user1", "test", "test", "test", "test", "94089", ["test"], "123-345-4567", ["Monday"], true);
    if(!volunteer1)
        await volunteer1.saveVolunteerProfile();

    const res = await agent.delete(`${HOST}/volunteers/user1`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`)
        .send({username: 'user2', firstName: 'test', lastName: 'test', city: 'test', state: 'test', zipCode: '94089', skills: ['test'], phoneNumber: '123-345-4567', availability: ['Monday'], consent: false});

    expect(res.status).toBe(200);

    const response = await agent.get(`${HOST}/volunteers/user1`)
        .set('Cookie', `token=${TokenUtil.generateToken(user1.getId())}`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({});
});