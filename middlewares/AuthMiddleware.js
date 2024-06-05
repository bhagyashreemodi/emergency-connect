import jwt from 'jsonwebtoken';
import { SECRET_KEY } from "../utils/Constants.js";
import { FORBIDDEN, OK } from "../utils/HttpStatus.js";
import User from "../models/User.js";
import ESNSpeedTestConfig from "../config/ESNSpeedTestConfig.js";

export default class AuthMiddleware {
    static #initializeResult() {
        return {
            success: false,
            status: FORBIDDEN,
            message: '',
            user: null,
        };
    }

    static #successResponse(user) {
        return {
            success: true,
            status: OK,
            message: 'authentication ok',
            user: user,
        };
    }

    static async #parseToken(req) {
        const result = this.#initializeResult();
        const token = req.cookies.token;

        if (!token) {
            result.message = 'authentication error - no token received';
            return result;
        }

        let username = '';
        try {
            const jwtDecoded = jwt.verify(token, SECRET_KEY);
            username = jwtDecoded.username.toLowerCase();
        } catch (e) {
            result.message = 'authentication error - invalid token';
            return result;
        }
        const user = await User.findUserById(username);
        if (!user) {
            result.message = 'authentication error - invalid token (user not found)';
            return result;
        }

        return this.#successResponse(user);
    }


    /**
     * Allow to proceed the next middleware if user is logged in,
     * otherwise *return an error message*
     * Will attach current user information to `req.user`
     * Privilege: any privilege levels
     */
    static async isAccessGranted(req, res, next) {
        let config = ESNSpeedTestConfig.getInstance();
        let isSpeedTestRequest = req.get('X-Speed-Test') || false;
        if(config.isSpeedTestStarted() && !isSpeedTestRequest) {
            return res.redirect('/error');
        }
        const parseResult = await AuthMiddleware.#parseToken(req);
        if (!parseResult.success)
            return res.status(parseResult.status).send({ message: parseResult.message });
        if (!parseResult.user.isActive)
            return res.status(FORBIDDEN).send({ message: 'authentication error - user inactive' });
        req.user = parseResult.user;
        next();
    }

    /**
     * Privilege: Coordinator or Administrator
     */
    static async isCoordinatorOrAbove(req, res, next) {
        let config = ESNSpeedTestConfig.getInstance();
        let isSpeedTestRequest = req.get('X-Speed-Test') || false;
        if(config.isSpeedTestStarted() && !isSpeedTestRequest) {
            return res.redirect('/error');
        }
        const parseResult = await AuthMiddleware.#parseToken(req);
        if (!parseResult.success)
            return res.status(parseResult.status).send({ message: parseResult.message });
        if (!parseResult.user.isActive)
            return res.status(FORBIDDEN).send({ message: 'authentication error - user inactive' });
        if (parseResult.user.privilege === 'Citizen')
            return res.status(FORBIDDEN).send(
                { message: 'authentication error - required privilege level: Coordinator or Administrator' });
        req.user = parseResult.user;
        next();
    }

    /**
     * Privilege: Administrator
     */
    static async isAdmin(req, res, next) {
        let config = ESNSpeedTestConfig.getInstance();
        let isSpeedTestRequest = req.get('X-Speed-Test') || false;
        if(config.isSpeedTestStarted() && !isSpeedTestRequest) {
            return res.redirect('/error');
        }
        const parseResult = await AuthMiddleware.#parseToken(req);
        if (!parseResult.success)
            return res.status(parseResult.status).send({ message: parseResult.message });
        if (!parseResult.user.isActive)
            return res.status(FORBIDDEN).send({ message: 'authentication error - user inactive' });
        if (parseResult.user.privilege !== 'Administrator')
            return res.status(FORBIDDEN).send(
                { message: 'authentication error - required privilege level: Administrator' });
        req.user = parseResult.user;
        next();
    }

    /**
     * @param successRedirect redirect if user is logged in (e.g., '/home')
     * @param failureRedirect redirect if user is NOT logged in (e.g., '/auth')
     * Leave param empty string ('') to go `next()`
     * @returns an express middleware
     */
    static isAuthRedirect(successRedirect = '', failureRedirect = '') {
        return async (req, res, next) => {
            let config = ESNSpeedTestConfig.getInstance();
            let isSpeedTestRequest = req.get('X-Speed-Test') || false;
            if(config.isSpeedTestStarted() && !isSpeedTestRequest) {
                return res.redirect('/error');
            }
            const parseResult = await AuthMiddleware.#parseToken(req);
            if (parseResult.success && parseResult.user.isActive) {  // user is logged in
                if (successRedirect)
                    return res.redirect(successRedirect);
                else
                    next();
            } else {                    // user is NOT logged in
                if (failureRedirect)
                    return res.redirect(failureRedirect);
                else
                    next();
            }
        }
    }
}