import { Server } from 'socket.io';
import User from "../models/User.js";
import TaskMatcher from "../utils/TaskMatcher.js";

export default class SocketioConfig {
    constructor() {
        if (SocketioConfig.instance) {
            throw new Error("Use SocketioConfig.getInstance() instead of new.");
        }
        this.io = null;
        this.userConnections = {};
        this.offlineTimeouts = {};
    }

    static getInstance() {
        if (!SocketioConfig.instance) {
            SocketioConfig.instance = new SocketioConfig();
        }
        return SocketioConfig.instance;
    }

    // If a user opens two tabs in a browser, and then close one tab, there will still be one active connection, and user-offline is not triggered
    // If a user opens two tabs in a browser, and then logs out in one tab, only when interacting with the second tab will it trigger user-offline
    init(httpServer) {
        this.io = new Server(httpServer);

        this.io.on('connection', (socket) => {
            const username = socket.handshake.query.username;
            console.log(`[SocketioConfig] connected from client, socket.id: ${socket.id}, username: ${username}`);

            this.handleUserConnection(username, socket);

            socket.on('disconnect', async () => {
                await this.handleUserDisconnection(username, socket);
            });

            /*socket.on('new-task-created', async (task) => {
                console.log(`[SocketioConfig] New task created: ${task.title}`);
                await TaskMatcher.matchTasksWithVolunteers(task);
            });*/
        });
    }

    async handleUserConnection(username, socket) {
        if (this.isNewConnection(username)) {
            this.logUserConnection(username);
            this.initializeUserConnection(username);
            await this.setUserOnline(username);
        }
    
        this.addSocketConnection(username, socket.id);
        this.logActiveConnections(username);
        this.clearOfflineTimeout(username);
    }
    
    isNewConnection(username) {
        return username && (!this.userConnections[username] || this.hasNoActiveConnections(username));
    }
    
    logUserConnection(username) {
        console.log(`[SocketioConfig] User ${username} connected.`);
    }
    
    initializeUserConnection(username) {
        this.userConnections[username] = { socketIds: [] };
    }
    
    addSocketConnection(username, socketId) {
        this.userConnections[username].socketIds.push(socketId);
    }
    
    clearOfflineTimeout(username) {
        if (this.offlineTimeouts[username]) {
            clearTimeout(this.offlineTimeouts[username]);
            delete this.offlineTimeouts[username];
        }
    }

    async handleUserDisconnection(username, socket) {
        try {
            this.logDisconnection(username, socket.id);
    
            if (this.isUserConnected(username)) {
                this.removeSocketConnection(username, socket.id);
                this.logActiveConnections(username);
    
                if (this.hasNoActiveConnections(username)) {
                    await this.setUserOfflineAfterTimeout(username, socket);
                }
            }
        } catch (error) {
            console.error(`Error toggling online status for user ${username}: ${error}`);
        }
    }
    
    logDisconnection(username, socketId) {
        console.log(`[SocketioConfig] disconnected from client, socket.id: ${socketId}, username: ${username}`);
    }
    
    isUserConnected(username) {
        return username && this.userConnections[username];
    }
    
    removeSocketConnection(username, socketId) {
        this.userConnections[username].socketIds = this.userConnections[username].socketIds.filter(id => id !== socketId);
    }
    
    logActiveConnections(username) {
        console.log(`[SocketioConfig] User ${username} has ${this.userConnections[username].socketIds.length} active connection(s).`);
    }
    
    hasNoActiveConnections(username) {
        return this.userConnections[username].socketIds.length === 0;
    }
    
    async setUserOfflineAfterTimeout(username, socket) {
        this.offlineTimeouts[username] = setTimeout(async () => {
            await this.setUserOffline(username);
            delete this.offlineTimeouts[username];
            socket.broadcast.emit('user-offline', username);
        }, 1000);
    }

    async setUserOnline(username) {
        const user = await User.findUser(username);
        if (user) {
            await user.setOnlineStatus(true);
        }
        console.log(`[SocketioConfig] User ${username} set to online after timeout.`);
        this.io.emit('user-online', username);
    }

    async setUserOffline(username) {
        const user = await User.findUser(username);
        if (user) {
            await user.setOnlineStatus(false);
        }
        console.log(`[SocketioConfig] User ${username} set to offline after timeout.`);
    }

    getSocketIdsByUsername(username) {
        // this is a number, need to make an array or object that stores the id
        if (!this.userConnections || !this.userConnections[username]) {
            console.log(`User ${username} not found or 'userConnections' object not initialized`);
            return []; // Return an empty array or handle as appropriate
        }
        return this.userConnections[username].socketIds;
    }

    getIO() {
        return this.io;
    }
}
