import express from 'express';
import http from 'http';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import DatabaseConnector from './DatabaseConnector.js';
import viewRouter from '../routes/ViewRoute.js';
import authRouter from '../routes/AuthRoute.js';
import publicChatRouter from '../routes/PublicChatRoute.js';
import SwaggerConfig from './SwaggerConfig.js';
import SocketioConfig from './SocketioConfig.js';
import DAO from '../db/DAO.js';
import MongoDBImpl from "../db/MongoDBImpl.js";
import privateChatRouter from "../routes/PrivateChatRoute.js";
import shareStatusRouter from "../routes/ShareStatusRoute.js";
import announcementRouter from '../routes/AnnouncementRoute.js';
import incidentRouter from '../routes/IncidentRoute.js';
import speedTestRouter from "../routes/ESNSpeedTestRoute.js";
import searchRouter from "../routes/SearchRoute.js";
import ShelterRouter from '../routes/ShelterRoute.js';
import resourceSharingRouter from "../routes/ResourceSharingRoute.js";
import administerRouter from '../routes/AdministerRoute.js';
import cloudinary from 'cloudinary';
import volunteerProfileRouter from "../routes/VolunteerProfileRoute.js";
import volunteerTasksManagementRouter from "../routes/VolunteerTaskManagementRoute.js";
import User from "../models/User.js";

export default class App {
    constructor() {
        this.app = express();
        this.httpServer = http.createServer(this.app);
        this.PORT = process.env.PORT || 3000;
        this.db = null;
    }

    async init() {
        config();
        await this.connectDatabase();
        this.setupExpress();
        this.setMiddlewares();
        this.setRoutes();
        this.setupSwagger();
        this.setupSocketio();
        this.setupDAO();
        this.setupCloudinary();
        await this.createInitialAdministrator();
        await this.start();
    }

    setMiddlewares() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());
    }

    setRoutes() {
        this.app.use(viewRouter);
        this.app.use(authRouter);
        this.app.use(publicChatRouter);
        this.app.use(privateChatRouter);
        this.app.use(shareStatusRouter);
        this.app.use(announcementRouter);
        this.app.use(incidentRouter);
        this.app.use(speedTestRouter);
        this.app.use(searchRouter);
        this.app.use(ShelterRouter);
        this.app.use(resourceSharingRouter);
        this.app.use(administerRouter);
        this.app.use(volunteerProfileRouter);
        this.app.use(volunteerTasksManagementRouter);
    }

    async start() {
        this.httpServer.listen(this.PORT, () => {
            console.log(`Server is running on port ${this.PORT}`);
        });
    }

    async connectDatabase() {
        this.db = DatabaseConnector.getInstance();
        console.log("Connecting to database...");
        await this.db.connectDatabase();
    }

    setupExpress() {
        this.app.set('view engine', 'ejs');
        this.app.use(express.static('public'));
        this.app.set('views', './views');
    }

    setupSwagger() {
        console.log("Setting up Swagger...");
        const swaggerConfig = new SwaggerConfig(this.app);
        swaggerConfig.generateDocs();
    }

    setupSocketio() {
        console.log("Setting up Socketio...");
        SocketioConfig.getInstance().init(this.httpServer);
    }

    setupDAO() {
        console.log("Setting up DAO...");
        DAO.db = new MongoDBImpl();     // dependency injection
    }

    setupCloudinary() {
        console.log("Setting up Cloudinary...");
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }

    async createInitialAdministrator() {
        console.log("Creating initial administrator account if not exists...");
        await User.saveInitialAdministrator();
    }

    async close() {
        await this.httpServer.close();
        await this.db.disconnect();
    }
}