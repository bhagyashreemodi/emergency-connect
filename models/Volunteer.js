import DAO from "../db/DAO.js";

export default class Volunteer {
    constructor(username, firstName, lastName, city, state, zipCode, skills, phoneNumber, availability, consent) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.skills = skills;
        this.phoneNumber = phoneNumber;
        this.availability = availability;
        this.consent = consent;
    }

    isValidAddress() {
        return this.city != null && this.city.trim() !== "" &&
            this.state != null && this.state.trim() !== "" &&
            this.zipCode != null && this.zipCode.trim() !== "";
    }

    isValidPhoneNumber() {
        const regex = /^\d{3}-\d{3}-\d{4}$/;
        return this.phoneNumber && this.phoneNumber.length === 12 && regex.test(this.phoneNumber);
    }

    isValidAvailability() {
        const allDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        if (this.availability.length <= 0 || this.availability.length > 7) return false;
        return this.availability.every(day => allDays.includes(day.toLowerCase()));
    }

    isValid() {
        return this.isValidAddress() && this.isValidPhoneNumber() && this.isValidAvailability();
    }

    async saveVolunteerProfile() {
        console.log("Saving volunteer profile to database");
        await DAO.db.saveVolunteerProfile(this);
    }

    static async findVolunteerProfile(username) {
        return await DAO.db.getVolunteerProfile(username);
    }

    async deleteVolunteerProfile() {
        console.log("Deleting volunteer profile from database");
        await DAO.db.deleteVolunteerProfile(this.username);
    }

    async updateVolunteerProfile(city, state, zipCode, skills, phoneNumber, availability, consent) {
        console.log("Updating volunteer profile in database");
        this.city = city;
        this.state = state;
        this.zipCode = zipCode;
        this.skills = skills;
        this.phoneNumber = phoneNumber;
        this.availability = availability;
        this.consent = consent;
        await DAO.db.updateVolunteerProfile(this);
    }

    static getVolunteerObject(volunteerObj) {
        return new Volunteer(
            (volunteerObj.username) ? volunteerObj.username : null,
            (volunteerObj.firstName) ? volunteerObj.firstName : '',
            (volunteerObj.lastName) ? volunteerObj.lastName : '',
            (volunteerObj.city) ? volunteerObj.city : '',
            (volunteerObj.state) ? volunteerObj.state : '',
            (volunteerObj.zipCode) ? volunteerObj.zipCode : '',
            (volunteerObj.skills) ? volunteerObj.skills : [],
            (volunteerObj.phoneNumber) ? volunteerObj.phoneNumber : '',
            (volunteerObj.availability) ? volunteerObj.availability : [],
            (volunteerObj.consent) ? volunteerObj.consent : false
        );
    }

    static async getAvailableVolunteers(zipCode, city, state, today, taskSkill) {
        return await DAO.db.getAvailableVolunteers(zipCode, city, state, today, taskSkill);
    }
}