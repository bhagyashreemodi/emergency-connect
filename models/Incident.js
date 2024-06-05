import User from "./User.js";
import DAO from "../db/DAO.js";

export default class Incident {
    constructor() {
        this._id = null;
        this.type = '';
        this.description = '';
        this.location = {
            type: 'Point',
            coordinates: [0, 0]
        };
        this.reportedBy = new User();
        this.timestamp = new Date();
        this.status = '';
        this.severity = '';
        this.lastEditedBy = null;
    }

    setAllFields(obj) {
        this._id   = (obj._id) ? obj._id : null;
        this.type = (obj.type) ? obj.type : '';
        this.description = (obj.description) ? obj.description : '';
        this.location = (obj.location) ? obj.location : {
            type: 'Point',
            coordinates: [0, 0]
        };
        this.reportedBy = (obj.reportedBy) ? obj.reportedBy : new User();
        this.status = (obj.status) ? obj.status : '';
        this.severity = (obj.severity) ? obj.severity : '';
        this.timestamp = (obj.timestamp) ? obj.timestamp : new Date();
        this.lastEditedBy = (obj.lastEditedBy) ? obj.lastEditedBy : new User();
        return this;
    }

    toResJson() {
        return {
            _id : this._id,
            type: this.type,
            description: this.description,
            location: this.location,
            reportedBy: this.reportedBy.username,
            status: this.status,
            severity: this.severity,
            timestamp: this.timestamp,
            lastEditedBy: this.lastEditedBy.username,
        };
    }

    static async getAllIncidents() {
        return await DAO.db.getAllIncidents();
    }

    static async findIncidentById(id) {
        const incident = await DAO.db.findIncidentById(id);
        if (incident) {
          return new Incident().setAllFields(incident);
        }
        return null;
    }

    async saveIncident() {
        await DAO.db.saveIncident(this);
    }

    static async updateIncident(id, updatedFields) {
        const updatedIncident = await DAO.db.updateIncident(id, updatedFields);
        if (updatedIncident) {
            return updatedIncident//.toResJson();
        }
        return null;
    }
    
    static async deleteIncidentById(id) {
        const deletedIncident = await DAO.db.deleteIncidentById(id);
        if (deletedIncident) {
            return deletedIncident//.toResJson();
        }
        return null;
    }
}