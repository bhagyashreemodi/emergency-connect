import jwt from "jsonwebtoken";
import {SECRET_KEY} from "./Constants.js";

export default class TokenUtil {
    static generateToken(username) {
        return jwt.sign({ username: username }, SECRET_KEY, { expiresIn: '1h' });
    }

    static verifyToken(token) {
        return jwt.verify(token, process.env.TOKEN_SECRET);
    }
}