import ResponseBody from "../models/ReponseBody.js";
import {BAD_REQUEST, CREATED, INTERNAL_SERVER_ERROR, NOT_FOUND, OK} from "../utils/HttpStatus.js";
import Volunteer from "../models/Volunteer.js";
export default  class VolunteerProfileController {
    constructor() {

    }

    async createVolunteerProfile(req, res) {
        let responseBody = new ResponseBody();
        responseBody.setSuccess(false);
        try {
            const {username, firstName, lastName, city, state, zipCode, skills, phoneNumber, availability, consent} = req.body;
            const user = req.user;
            let volunteer = await Volunteer.findVolunteerProfile(user.username);
            if (volunteer) {
                responseBody.setMessage('Volunteer already exists');
                return res.status(BAD_REQUEST).send(responseBody);
            }
            const newVolunteer = new Volunteer(user.username, firstName, lastName, city, state, zipCode, skills, phoneNumber, availability, consent);
            if(!newVolunteer.isValid()) {
                responseBody.setMessage('Invalid volunteer profile');
                return res.status(BAD_REQUEST).send(responseBody);
            }
            await newVolunteer.saveVolunteerProfile();
            responseBody.setMessage('Volunteer profile created successfully!');
            responseBody.setSuccess(true);
            return res.status(CREATED).send(responseBody);
        } catch (error) {
            console.error(error);
            responseBody.setMessage(error.message);
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }

    }

    async retrieveVolunteerProfile(req, res) {
        console.log("Retrieving volunteer profile");
        let responseBody = new ResponseBody();
        try {
            const {username} = req.params;
            const user = req.user;
            if (!user) {
                console.log(`[Volunteer Profile] User not found: ${username}`);
                responseBody.setMessage('Volunteer not found');
                console.log(responseBody);
                return res.status(NOT_FOUND).send(responseBody);
            }
            let volunteer = await Volunteer.findVolunteerProfile(user.username);
            return res
                .status(OK)
                .send(volunteer);
        } catch (error) {
            console.error(error);
            responseBody.setMessage('Internal Server Error');
            responseBody.setSuccess(false);
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }
    }

    async deleteVolunteerProfile(req, res) {
        let responseBody = new ResponseBody();
        responseBody.setSuccess(false);
        try {
            const {username} = req.params;
            const user = req.user;
            let volunteer = await Volunteer.findVolunteerProfile(user.username);
            if (!volunteer) {
                console.log(`[Volunteer Profile] Volunteer not found: ${username}`);
                responseBody.setMessage('Volunteer not found');
                console.log(responseBody);
                return res.status(NOT_FOUND).send(responseBody);
            }
            await volunteer.deleteVolunteerProfile();
            responseBody.setMessage('Volunteer profile deleted successfully!');
            responseBody.setSuccess(true);
            return res
                .status(OK)
                .send(responseBody);
        } catch (error) {
            console.error(error);
            responseBody.setMessage('Internal Server Error');
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }
    }

    async updateVolunteerProfile(req, res) {
        let responseBody = new ResponseBody();
        responseBody.setSuccess(false);
        try {
            const user = req.user;
            let volunteer = await Volunteer.findVolunteerProfile(user.username);
            if (!volunteer) {
                console.log(`[Volunteer Profile] Volunteer not found: ${username}`);
                responseBody.setMessage('Volunteer not found');
                console.log(responseBody);
                return res.status(NOT_FOUND).send(responseBody);
            }
            const {city, state, zipCode, skills, phoneNumber, availability, consent} = req.body;
            await volunteer.updateVolunteerProfile(city, state, zipCode, skills, phoneNumber, availability, consent);
            responseBody.setMessage('Volunteer profile updated successfully!');
            responseBody.setSuccess(true);
            return res
                .status(OK)
                .send(responseBody);
        } catch (error) {
            console.error(error);
            responseBody.setMessage('Internal Server Error');
            res.status(INTERNAL_SERVER_ERROR).send(responseBody);
        }
    }
}