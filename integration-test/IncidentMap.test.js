
import User from "../models/User.js";
import Incident from "../models/Incident.js";
import agent from 'superagent';
import App from '../config/App.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, beforeEach, expect, test } from "@jest/globals";
import JestEnvSetup from "./JestEnvSetup.js";
import TokenUtil from "../utils/TokenUtil.js";

let mongoServer, user;
let HOST = `http://localhost:4004`;
let app;
let dummy = {
  _id: '60f1b9b3b3b3b3b3b3b3b3b3',
  username: 'arthur',
  password: 'vwy207',
  status: 'Ok'
};

async function setupIncidents() {
  let newIncident = new Incident().setAllFields({
    type: 'Fire',
    description: 'A fire incident',
    location: { type: 'Point', coordinates: [40.7128, -74.0060] },
    reportedBy: user,
    status: 'Open',
    severity: 'High',
  });
  await newIncident.saveIncident();
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  JestEnvSetup.setupEnv(mongoServer.getUri(), 4004);
  app = new App();
  await app.init().then(() => {
    console.log("--------------- Server Started ---------------");
  });
  user = new User().setAllFields({ _id: dummy._id, username: dummy.username, password: dummy.password });
  await user.save();
  await setupIncidents();
});

afterAll(async () => {
  await app.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
  JestEnvSetup.resetEnv();
});

test('Can retrieve incidents via GET request', async () => {
    await agent.get(`${HOST}/incidents`)
      .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
      .then(res => {
        expect(res.statusCode).toBe(200);
        expect(res.body).toBeInstanceOf(Array);
        const resIncidents = res.body;
        resIncidents.forEach((incident) => {
          expect(incident.type).toBe('Fire');
          expect(incident.description).toBe('A fire incident');
          expect(incident.location).toEqual({ type: 'Point', coordinates: [40.7128, -74.0060] });
          expect(incident.reportedBy).toEqual(expect.objectContaining({ username: dummy.username }));
          expect(incident.status).toBe('Open');
          expect(incident.severity).toBe('High');
        });
      })
      .catch(error => {
        throw error;
      });
  });
  
test('Can update an incident via PUT request', async () => {
  let incidentToUpdate;
  await agent.get(`${HOST}/incidents`)
    .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
    .then(res => {
      incidentToUpdate = res.body[0];
    });

  const updatedIncidentData = {
    type: 'Flood',
    description: 'Updated incident description',
    status: 'Closed',
    severity: 'Medium',
  };

  await agent.put(`${HOST}/incidents/${incidentToUpdate._id}`)
    .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
    .send(updatedIncidentData)
    .then(res => {
      expect(res.statusCode).toBe(200);
    })
    .catch(error => {
      throw error;
    });

  await agent.get(`${HOST}/incidents`)
    .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
    .then(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      const resIncidents = res.body;
      expect(resIncidents.length).toBe(1);
      const updatedIncident = resIncidents[0];
      expect(updatedIncident.type).toBe(updatedIncidentData.type);
      expect(updatedIncident.description).toBe(updatedIncidentData.description);
      expect(updatedIncident.status).toBe(updatedIncidentData.status);
      expect(updatedIncident.severity).toBe(updatedIncidentData.severity);
      expect(updatedIncident.reportedBy).toEqual(expect.objectContaining({ username: dummy.username }));
    })
    .catch(error => {
      throw error;
    });
});


test('Can create a new incident via POST request', async () => {
  const newIncidentData = {
    type: 'Earthquake',
    description: 'A new earthquake incident',
    location: {
      type: 'Point',
      coordinates: [37.7749, -122.4194]
    },
    status: 'Open',
    severity: 'Critical',
  };

  await agent.post(`${HOST}/incidents`)
    .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
    .send(newIncidentData)
    .then(res => {
      expect(res.statusCode).toBe(201);
      expect(res.body.incident.type).toBe(newIncidentData.type);
      expect(res.body.incident.description).toBe(newIncidentData.description);
      expect(res.body.incident.location).toEqual(newIncidentData.location);
      expect(res.body.incident.reportedBy).toEqual(expect.objectContaining({ username: dummy.username }));
      expect(res.body.incident.status).toBe(newIncidentData.status);
      expect(res.body.incident.severity).toBe(newIncidentData.severity);
    })
    .catch(error => {
        throw error;
    });
});

test('Can delete an incident via DELETE request', async () => {
  let incidentToDelete;
  await agent.get(`${HOST}/incidents`)
    .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
    .then(res => {
      incidentToDelete = res.body[0];
    });

  await agent.delete(`${HOST}/incidents/${incidentToDelete._id}`)
    .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
    .then(res => {
      expect(res.statusCode).toBe(200);
    })
    .catch(error => {
        throw error;
    });

  await agent.get(`${HOST}/incidents`)
    .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
    .then(res => {
      expect(res.statusCode).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);  // Only the incident created in the test above should be present
    })
    .catch(error => {
        throw error;
    });
});

test('Should return 404 if incident is not found during update', async () => {
    const nonExistentIncidentId = '000000000000000000000000';
    const updatedIncidentData = {
      type: 'Flood',
      description: 'Updated incident description',
      status: 'Closed',
      severity: 'Medium',
    };
  
    await agent.put(`${HOST}/incidents/${nonExistentIncidentId}`)
      .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
      .send(updatedIncidentData)
      .catch(error => {
        expect(error.response.statusCode).toBe(404);
        expect(error.response.body.message).toBe('Incident not found');
      });
});
  
test('Should return 400 if required fields are missing during incident creation', async () => {
    const incompleteIncidentData = {
      type: 'Earthquake',
      description: 'A new earthquake incident',
      // Missing location, status, and severity fields
    };
  
    await agent.post(`${HOST}/incidents`)
      .set('Cookie', `token=${TokenUtil.generateToken(user.getId())}`)
      .send(incompleteIncidentData)
      .catch(error => {
        expect(error.response.statusCode).toBe(400);
        expect(error.response.body.message).toBe('Missing required fields');
      });
});