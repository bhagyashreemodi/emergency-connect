export default class JestEnvSetup {
    static setupEnv(dbUri, serverPort) {
        process.env.MONGODB_URI = dbUri;
        process.env.PORT = serverPort;
    }

    static resetEnv() {
        process.env.MONGODB_URI = null;
        process.env.PORT = null;
    }
}