import agent from 'superagent';
import App from '../config/App.js';
import {MongoMemoryServer} from 'mongodb-memory-server';
import JestEnvSetup from "./JestEnvSetup.js";
import {afterAll, beforeAll, beforeEach, expect, test} from "@jest/globals";
import User from "../models/User.js";
import TokenUtil from "../utils/TokenUtil.js";
import PasswordHelper from "../utils/PasswordHelper.js";

let mongoServer, user1, user2;
let admin;
let HOST = `http://localhost:4005`;
let app

async function setupUsers() {
    user1 = new User().setAllFields({username: 'user1', password: 'password'});
    user2 = new User().setAllFields({username: 'user2', password: 'password'});
    await user1.save();
    await user2.save();
    user1 = await User.findUser('user1');
    user2 = await User.findUser('user2');
}

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4005);
    app = new App();
    await app.init().then(() => {
        console.log("--------------- Server Started ---------------");
    });
    admin = await User.findUser('esnadmin');
    console.log(admin);
    await setupUsers();
});

afterAll(async () => {
    await app.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
    JestEnvSetup.resetEnv();
});

test('The system should have at least one Administrator created initially', async () => {
    const response = await agent.get(`${HOST}/users/ESNAdmin`)
        .set('Cookie', `token=${TokenUtil.generateToken(admin.getId())}`);

    expect(response.status).toBe(200);
    expect(response.body.user.privilege).toBe('Administrator');
    expect(response.body.user.status).toBe('OK');
    expect(response.body.user.isActive).toBe(true);
});

test('should successfully update account status to InActive', async () => {
    try {
        const res = await agent.put(`${HOST}/users/user1`)
            .set('Cookie', `token=${TokenUtil.generateToken(admin.getId())}`)
            .send({isActive: '0'});
        expect(res.status).toBe(200);

        const response = await agent.get(`${HOST}/users/user1`)
            .set('Cookie', `token=${TokenUtil.generateToken(admin.getId())}`);

        expect(response.status).toBe(200);
        expect(response.body.user.isActive).toBe(false);
    } catch (e) {
        console.log(e);
        throw e;
    }
});

test('should successfully update user privilege to Coordinator', async () => {
    try {
        let testuser = new User().setAllFields({username: 'testuser', password: 'password', _id: 'testuser'});
        await testuser.save();
        const res = await agent.put(`${HOST}/users/testuser`)
            .set('Cookie', `token=${TokenUtil.generateToken(admin.getId())}`)
            .send({privilege: 'Coordinator'});

        expect(res.status).toBe(200);

        const response = await agent.get(`${HOST}/users/testuser`)
            .set('Cookie', `token=${TokenUtil.generateToken(testuser.getId())}`);

        expect(response.status).toBe(200);
        expect(response.body.user.privilege).toBe('Coordinator');
    } catch (e) {
        console.log(e);
        throw e;
    }
});

test('should successfully update user username', async () => {
    try {
        let testchangeuser = new User().setAllFields({username: 'testchangeuser', password: 'password', _id: 'testchangeuser'});
        await testchangeuser.save();

        const res = await agent.put(`${HOST}/users/testchangeuser`)
            .set('Cookie', `token=${TokenUtil.generateToken(admin.getId())}`)
            .send({username: 'updatedusername'});

        expect(res.status).toBe(200);
        const response = await agent.get(`${HOST}/users/updatedusername`)
            .set('Cookie', `token=${TokenUtil.generateToken(testchangeuser.getId())}`);
        expect(response.status).toBe(200);
        expect(response.body.user.username).toBe('updatedusername');
        expect(response.body.user.isActive).toBe(true);
    } catch (e) {
        console.log(e);
        throw e;
    }
});

test('should successfully update user password', async () => {
    try {
        let testchangepassword = new User().setAllFields({username: 'testchangepassword', password: 'password', _id: 'testchangepassword'});
        await testchangepassword.save();

        const res = await agent.put(`${HOST}/users/testchangepassword`)
            .set('Cookie', `token=${TokenUtil.generateToken(admin.getId())}`)
            .send({password: 'newpassword'});

        expect(res.status).toBe(200);
        const response = await agent.get(`${HOST}/users/testchangepassword`)
            .set('Cookie', `token=${TokenUtil.generateToken(testchangepassword.getId())}`);
        expect(response.status).toBe(200);
        expect(response.body.user.isActive).toBe(true);
        const isPasswordCorrect = await PasswordHelper.comparePassword('newpassword', response.body.user.password);
        expect(isPasswordCorrect).toBe(true);
    } catch (e) {
        console.log(e);
        throw e;
    }
});