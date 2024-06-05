import User from "../models/User.js";
import Post from "../models/Post.js";
import agent from 'superagent';
import App from '../config/App.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, expect, test } from "@jest/globals";
import JestEnvSetup from "./JestEnvSetup.js";
import TokenUtil from "../utils/TokenUtil.js";
import e from "express";

let mongoServer, user;
let HOST = `http://localhost:4003`;
let app;
let dummy = { _id: '60f1b9b3b3b3b3b3b3b3b3b3', username: 'arthur', password: 'vwy207', status: 'OK' };

async function setup() {
    user = new User().setAllFields({ username: dummy.username, password: dummy.password });
    await user.save();
    let newPost = new Post().setAllFields({
        sender: user,
        content: 'This is a test post',
        imgUrl: 'https://res.cloudinary.com/dqpkslelv/image/upload/v1712705727/white-modern-house-curved-patio-archway-c0a4a3b3-aa51b24d14d0464ea15d36e05aa85ac9_rk5gkp.webp'
    });
    await newPost.save();
}

beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    JestEnvSetup.setupEnv(mongoServer.getUri(), 4003);
    app = new App();
    await app.init().then(() => {
        console.log("--------------- Server Started ---------------");
    });
    await setup();
});

afterAll(async () => {
    await app.close();
    if (mongoServer) {
        await mongoServer.stop();
    }
    JestEnvSetup.resetEnv();
});

test('Can retrieve shelter posts via GET request', async () => {
    await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            // Assuming posts have a 'content' field to check
            res.body.forEach(post => {
                expect(post).toHaveProperty('message');
            });
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });
});

test('Can create a shelter post via POST request with file upload', async () => {
    // Path to the photo file to be uploaded
    const photoPath = './integration-test/test-files/test-image.jpg';
    const msg = 'This is a test post';
    const token = TokenUtil.generateToken(user.getId());

    // Perform the POST request simulating form data submission
    await agent.post(`${HOST}/shelters`)
        .set('Cookie', `token=${token}`)
        .attach('photo', photoPath) // Ensure 'photo' matches the field name expected by your server
        .field('msg', msg) // Send the message as a field
        .then(res => {
            expect(res.statusCode).toBe(200);
            let responseBody = res.body;
            expect(responseBody.success).toBe(true);
            expect(responseBody.data.postContent).toBe(msg);
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });

    await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            // Assuming posts have a 'content' field to check
            res.body.forEach(post => {
                expect(post).toHaveProperty('message');
            });
            expect(res.body.length).toBe(2);
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });
});

test('Can delete a shelter post via DELETE request', async () => {
    const response = await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`);
    const postId = response.body[1].postId;
    await agent.delete(`${HOST}/shelters/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            expect(res.statusCode).toBe(200);
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });

    await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            // Assuming posts have a 'content' field to check
            res.body.forEach(post => {
                expect(post).toHaveProperty('message');
            });
            expect(res.body.length).toBe(1);
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });
});

test('Can update a shelter post via PUT request', async () => {
    const response = await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`);
    const postId = response.body[0].postId;
    await agent.put(`${HOST}/shelters/${postId}`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .field('msg', 'Updated post content')
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Update Shelter Post');
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });

    await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            // Assuming posts have a 'content' field to check
            res.body.forEach(post => {
                expect(post.message).toBe('Updated post content');
            });
            expect(res.body.length).toBe(1);
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });
});

test('Can send a message to a post via POST request', async () => {
    const response = await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`);
    const postId = response.body[0].postId;
    await agent.post(`${HOST}/shelters/${postId}/message`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .send({ messageContent: 'This is a test message to the post' })
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body.message).toBe('Message sent to post');
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });

    await agent.get(`${HOST}/shelters/${postId}/message`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            res.body.forEach(message => {
                expect(message).toHaveProperty('message');
            });
            expect(res.body.length).toBe(1);
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });
});

test('Can retrieve messages from a post via GET request', async () => {
    const response = await agent.get(`${HOST}/shelters`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`);
    const postId = response.body[0].postId;
    await agent.get(`${HOST}/shelters/${postId}/message`)
        .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
        .then(res => {
            expect(res.statusCode).toBe(200);
            expect(res.body).toBeInstanceOf(Array);
            res.body.forEach(message => {
                expect(message).toHaveProperty('message');
            });
        })
        .catch(e => {
            console.error(e);
            expect(e).toBeUndefined();
        });
});