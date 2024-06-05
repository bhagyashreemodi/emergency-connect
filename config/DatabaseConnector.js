import mongoose from 'mongoose';

export default class DatabaseConnector {
    constructor() {
        this.conection = null;
    }

    static getInstance() {
        if (!DatabaseConnector.instance) {
            DatabaseConnector.instance = new DatabaseConnector();
        }
        return DatabaseConnector.instance;
    }

    getConnection() {
        return this.conection;
    }

    async connectDatabase() {
        try {
            if(!process.env.MONGODB_URI)
                throw new Error("MONGODB_URI is not set in .env file");
            await mongoose.connect(process.env.MONGODB_URI);
            this.conection = mongoose.connection;
            console.log("connected to DB.");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
            throw error;
        }
    }

    async disconnect() {
        await this.conection.close();
    }

    async switchDatabase(mongoDbUri) {
        try {
            console.log(`Switching database to ${mongoDbUri}`);
            if(!mongoDbUri)
                throw new Error("Invalid MongoDB URI");
            if (mongoose.connection.readyState === 1) { // If already connected
                await mongoose.disconnect();
            }
            await mongoose.connect(mongoDbUri);
            this.conection = mongoose.connection;
            console.log("connected to DB.");
        } catch (error) {
            console.error("Error switching database:", error);
            throw error;
        }
    }

    async deleteDatabase() {
        try {
            await this.conection.dropDatabase();
            console.log("Database deleted.");
        } catch (error) {
            console.error("Error deleting test database:", error);
            throw error;
        }
    }

    async deleteCollections() {
        try {
            const collections = await this.conection.db.listCollections().toArray();
            for (let collection of collections) {
                try {
                    await mongoose.connection.db.dropCollection(collection.name);
                    console.log(`Dropped collection: ${collection.name}`);
                } catch (error) {
                    console.error(`Error dropping collection ${collection.name}:`, error);
                }
            }
            console.log("Collections deleted.");
        } catch (error) {
            console.error("Error deleting collections:", error);
            throw error;
        }
    }
}
