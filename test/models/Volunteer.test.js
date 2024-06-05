import Volunteer from "../../models/Volunteer.js";
import {expect, test} from "@jest/globals";


test("Valid Address: should return true if city, state and zip code is provided", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        "test", "94089", ["test"], "123-345-4567", ["test"], true);
    expect(volunteer.isValidAddress()).toBe(true);
});

test("InValid City: should return false if either city is missing", () => {
    let volunteer = new Volunteer("test", "test", "test", null,
        "test", "94089", ["test"], "123-345-4567", ["test"], true);
    expect(volunteer.isValidAddress()).toBe(false);
});

test("InValid State: should return false if state is missing", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        null, "94089", ["test"], "123-345-4567", ["test"], true);
    expect(volunteer.isValidAddress()).toBe(false);
});

test("InValid Zip Code: should return false if zip code is missing", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        "test", null, ["test"], "123-345-4567", ["test"], true);
    expect(volunteer.isValidAddress()).toBe(false);
});

test("InValid Phone NUmber: should return false if phone number is invalid", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        "test", "94089", ["test"], "123-345-456", ["test"], true);
    expect(volunteer.isValidPhoneNumber()).toBe(false);
});

test("Valid Phone Number: should return true if phone number is valid", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        "test", "94089", ["test"], "123-345-4567", ["test"], true);
    expect(volunteer.isValidPhoneNumber()).toBe(true);
});

test("InValid Availability: should return false if availability is missing", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        "test", "94089", ["test"], "123-345-4567", [], true);
    expect(volunteer.isValidAvailability()).toBe(false);
});

test("InValid Availability: should return false if availability is having invalid value", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        "test", "94089", ["test"], "123-345-4567", ["InValidDay"], true);
    expect(volunteer.isValidAvailability()).toBe(false);
});

test("Valid Availability: should return true if availability is having valid day value", () => {
    let volunteer = new Volunteer("test", "test", "test", "test",
        "test", "94089", ["test"], "123-345-4567", ["Monday"], true);
    expect(volunteer.isValidAvailability()).toBe(true);
});