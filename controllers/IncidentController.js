import Incident from "../models/Incident.js";
import { INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND, OK, CREATED } from "../utils/HttpStatus.js";
import User from "../models/User.js";
import ResponseBody from "../models/ReponseBody.js";
export default class IncidentController {
  constructor() {
    console.log("IncidentController constructor called");
  }

  async getAllIncidents(req, res) {
    try {
      const incidents = await Incident.getAllIncidents();
      if (incidents) {
        return res.status(OK).send(incidents);
      } else {
        console.error('No incidents found');
        return res.status(NOT_FOUND).send({ message: 'No incidents found' });
      }
    } catch (error) {
      console.error('Error retrieving incidents:', error);
      return res.status(INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
    }
  }

  async createIncident(req, res) {
    try {
      const { type, description, location, status, severity } = req.body;
      let responseBody = new ResponseBody();
      if (!type || !description || !location || !status || !severity) {
        return res.status(BAD_REQUEST).send({ message: 'Missing required fields' });
      }
  
      const user = await User.findUser(req.user.username);
      
      if (!user) {
        console.log(`[Report Incident] User not found: ${req.user.username}`);
            responseBody.setMessage('User not found');
            console.log(responseBody);
            return res.status(NOT_FOUND).send(responseBody);
      }
  
      const newIncident = new Incident();
      newIncident.setAllFields({
        type,
        description,
        location,
        reportedBy: user,
        reportedAt: new Date(),
        status,
        severity,
      });
  
      await newIncident.saveIncident();
  
      return res.status(CREATED).send({ message: 'Incident created successfully', incident: newIncident/*.toResJson()*/ });
    } catch (error) {
      console.error('Error creating incident:', error);
      return res.status(INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
    }
  }

  async deleteIncident(req, res) {
    try {
      const incidentId = req.params._id;
      console.log(`[Delete Incident] incidentId: ${incidentId}`);
  
      const deletedIncident = await Incident.deleteIncidentById(incidentId);
      if (!deletedIncident) {
        return res.status(NOT_FOUND).send({ message: 'Incident not found' });
      }
  
      return res.status(OK).send({ message: 'Incident deleted successfully' });
    } catch (error) {
      console.error('Error deleting incident:', error);
      return res.status(INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
    }
  }
  
  async updateIncident(req, res) {
    try {
      const incidentId = req.params._id;
      const { type, description, status, severity } = req.body;
      const responseBody = new ResponseBody();

      const validFields = ['type', 'description', 'status', 'severity', 'location', 'reportedBy', 'lastEditedBy'];
      const invalidFields = Object.keys(req.body).filter(field => !validFields.includes(field));

      if (invalidFields.length > 0) {
        return res.status(BAD_REQUEST).send({ message: 'Invalid update fields' });
      }
      const updatedFields = {
        type,
        description,
        status,
        severity,
      };
      
      const user = await User.findUser(req.user.username);
      
      if (!user) {
        console.log(`[Report Incident] User not found: ${req.user.username}`);
            responseBody.setMessage('User not found');
            console.log(responseBody);
            return res.status(NOT_FOUND).send(responseBody);
      }

      updatedFields.lastEditedBy = user;
   
      const updatedIncident = await Incident.updateIncident(incidentId, updatedFields);
      if (!updatedIncident) {
        return res.status(NOT_FOUND).send({ message: 'Incident not found' });
      }
  
      return res.status(OK).send({
        message: 'Incident updated successfully!',
        incident: updatedIncident,
      });
    } catch (error) {
      console.error('Error updating incident:', error);
      return res.status(INTERNAL_SERVER_ERROR).send({ message: 'Internal Server Error' });
    }
  }
}