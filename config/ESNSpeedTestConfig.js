import DatabaseConnector from "./DatabaseConnector.js";

export default class ESNSpeedTestConfig {
    constructor() {
        if (ESNSpeedTestConfig.instance) {
            throw new Error("Use ESNSpeedTestConfig.getInstance() instead of new.");
        }
        else {
            console.log("Creating new ESNSpeedTestConfig instance");
            this.db = DatabaseConnector.getInstance();
            this.speedTestStarted = false;
        }
    }

    static getInstance() {
        if (!ESNSpeedTestConfig.instance) {
            ESNSpeedTestConfig.instance = new ESNSpeedTestConfig();
        }
        return ESNSpeedTestConfig.instance;
    }

    isSpeedTestStarted() {
        return this.speedTestStarted;
    }

    async setupAndStartSpeedTest() {
        try {
            this.speedTestStarted = true;
            await this.db.switchDatabase(process.env.MONGODB_URI_TEST);
        } catch (error) {
            console.error("Error starting speed test:", error);
            throw error;
        }
    }

    async stopSpeedTest() {
        try {
            await this.destroy();
            await this.db.switchDatabase(process.env.MONGODB_URI);
            this.speedTestStarted = false;
        } catch (error) {
            console.error("Error stopping speed test:", error);
            throw error;
        }
    }

    async destroy() {
        try {
            await this.db.deleteCollections();
            await this.db.disconnect();
        } catch (error) {
            console.error("Error destroying ESNSpeedTestConfig:", error);
            throw error;
        }
    }
}