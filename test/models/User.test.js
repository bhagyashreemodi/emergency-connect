import User from "../../models/User.js";
import {expect, jest, test} from "@jest/globals";

test("User.isReservedUser should return true if the username is reserved", () => {
    const result = User.isReservedUser("admin");
    expect(result).toBe(true);
});

test("User.isReservedUser should return false if the username is not reserved", () => {
    const result = User.isReservedUser("testUser");
    expect(result).toBe(false);
});

test("User.isUsernameTooShort should return true if the username is less than 3 characters long", () => {
    const user = new User();
    user.username = "ab";
    expect(user.isUsernameTooShort()).toBe(true);
});

test("User.isUsernameTooShort should return false if the username is 3 or more characters long", () => {
    const user = new User();
    user.username = "abc";
    expect(user.isUsernameTooShort()).toBe(false);
});

test("User.setAllFields should be case insensitive when setting the username", () => {
    const user = new User();
    user.setAllFields({username: "TESTuser"});
    expect(user.username).toBe("testuser");
});

test('isReservedUser should be case insensitive', () => {
    expect(User.isReservedUser("AdMiN")).toBe(true);
});

test('Password shorter than 4 characters should be considered too short', () => {
    const user = new User();
    user.setAllFields({password: "123"});
    expect(user.isPasswordTooShort()).toBe(true);
});

test('Password of 4 or more characters should not be considered too short', () => {
    const user = new User();
    user.setAllFields({password: "pass1234"})
    expect(user.isPasswordTooShort()).toBe(false);
});

test('Password should not match if different case', () => {
    const user = new User();
    user.setAllFields({password: "PASSWORD"});
    expect(user.getPassword() === 'password').toBeFalsy();
});

test('Password should match only if same case', () => {
    const user = new User();
    user.setAllFields({password: "PASSWORD"});
    expect(user.getPassword() === 'PASSWORD').toBeTruthy();
});

test('should create an initial administrator user', () => {
    const user = User.createInitialAdminUser();

    expect(user.getUsername()).toBe('esnadmin');
    expect(user.getPassword()).toBe('admin');
    expect(user.getStatus()).toBe('OK');
    expect(user.privilege).toBe('Administrator');
});

test('should set the account status as Active by default', async () => {
    const user = new User();

    expect(user.isActive).toBe(true);
});


