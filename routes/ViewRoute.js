import { Router } from 'express';
import AuthMiddleware from "../middlewares/AuthMiddleware.js";

const viewRouter = Router();

/**
 * Use methods to wrap around view setup
 *   to avoid Sigrid unit size complaint
 */
class ViewRouterInitializer {
    constructor() { }

    static setupAll() {
        ViewRouterInitializer.#setupMainViews();
        ViewRouterInitializer.#setupHomePageTabs();
        ViewRouterInitializer.#setupResourcesTabContents();
        ViewRouterInitializer.#setupOtherViews();
    }

    static #setupMainViews() {
        viewRouter.get('/', (req, res) => {
            return res.render('index');
        });

        viewRouter.get('/auth', AuthMiddleware.isAuthRedirect('/home?#esn-directory', ''), (req, res) => {
            return res.render('auth');
        });

        viewRouter.get('/home', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('home');
        });

        viewRouter.get('/error', (req, res) => {
            return res.render('error');
        });
    }

    static #setupHomePageTabs() {
        viewRouter.get('/esn-directory', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('esn-directory');
        });

        viewRouter.get('/public-wall', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('public-wall');
        });

        viewRouter.get('/dms', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('dms');
        });

        viewRouter.get('/announcement', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('announcement');
        });

        viewRouter.get('/resources', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('resources');
        });
    }

    static #setupResourcesTabContents() {
        ViewRouterInitializer.#setupVolunteerManagement();

        viewRouter.get('/shelter', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('shelter');
        });

        viewRouter.get('/post-chat', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('post-chat');
        });

        viewRouter.get('/incident-map', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('incident-map');
        });

        viewRouter.get('/resource-sharing-hub', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('resource-sharing-hub');
        });
    }

    static #setupVolunteerManagement() {
        // views for volunteer management use case
        viewRouter.get('/volunteer-management', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('volunteer-management');
        });

        viewRouter.get('/volunteer-profile', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('volunteer-profile');
        });

        viewRouter.get('/volunteer-tasks-management', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('volunteer-tasks-management');
        });
    }

    static #setupOtherViews() {
        viewRouter.get('/private-chat', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('private-chat');
        });

        viewRouter.get('/esn-speed-test', AuthMiddleware.isAuthRedirect('', '/auth'), (req, res) => {
            return res.render('speed-test');
        });
    }
}

ViewRouterInitializer.setupAll();

export default viewRouter;
