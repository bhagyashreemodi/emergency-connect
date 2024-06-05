class SocketManager {
    constructor() {
        // init socket connection
        const username = localStorage.getItem('username');
        if (username)
            this.socket = io(`/?username=${encodeURIComponent(localStorage.getItem('username'))}`);
        else
            this.socket = io();

        this.setupHandler();
    }

    setupHandler() {
        this.socket.on('user-online', SocketManager.handlerUserOnlineOffline);
        this.socket.on('user-offline', SocketManager.handlerUserOnlineOffline);
        this.socket.on('user-update-status', SocketManager.handlerUserShareStatus);

        // receive public message push from server
        this.socket.on('public-message', SocketManager.handlerPublicMessage);

        // receive post announcement push from server
        this.socket.on('post-announcement', SocketManager.handlerPostAnnouncement);

        // receive private message push from server
        this.socket.on('private-message', SocketManager.handlerPrivateMessage);

        // receive ResourceRequestPost update from server
        this.socket.on('resource-sharing-post', SocketManager.handlerResourceSharing);

        // receive post shelter push from server
        this.socket.on('shelter-post', SocketManager.handlerShelterPost);

        // receive delete shelter push from server
        this.socket.on('delete-shelter-post', SocketManager.handlerShelterDelete);

        // receive update shelter push from server
        this.socket.on('update-shelter-post', SocketManager.handlerShelterUpdate);

        // receive shelter post message push from server
        this.socket.on('shelter-post-message', SocketManager.handlerShelterPostMessage);

        this.socket.on('new-task-created', SocketManager.handleNewTaskCreated);

        this.socket.on('admin-update-user', SocketManager.handlerUserUpdateStatus);

        this.socket.on('user-inactive', SocketManager.handlerUserInactive);


    }

    static async handlerUserOnlineOffline(username) {
        try {
            if (homePage.isESNDirectoryTabOpen())
                await esnDirectory.updateUserDirectory();
            else if (homePage.isDmsTabOpen())
                await esnDirectory.loadDms();
        } catch (error) {
            console.error('Failed to update user status:', error);
        }
    }

    static async handlerUserShareStatus() {
        try {
            if (homePage.isESNDirectoryTabOpen()) {
                await esnDirectory.updateUserDirectory();
                await esnDirectory.fetchAndDisplayUserInfo();
            } else if (homePage.isDmsTabOpen()) {
                await esnDirectory.loadDms();
            }
        } catch (error) {
            console.error('Failed to update user status:', error);
        }
    }

    static handleNewTaskCreated(task) {
        volunteerManagement.viewAssignedTasks()
            .then(r => console.log('New task created'))
            .catch(e => console.error(e));
    }
    static handlerPublicMessage(message) {
        if (homePage.isPublicWallTabOpen()) {
            const statusClass = Utils.getStatusClass(message.status);
            Utils.displayMessage(message, statusClass);
        }
    }
    
    static handlerPostAnnouncement(message) {
        if (homePage.isAnnouncementTabOpen()) {
            Utils.displayMessage(message);
        }
    }

    static handlerShelterPost(message) {
        if (homePage.isShelterTabOpen()) {
            shelter.retrieveShelterPosts();
        }
    }

    static handlerShelterUpdate(data) {
        if (homePage.isShelterTabOpen())
            shelter.updateContent(data.postId, data.message, data.imgUrl);
    }

    static handlerShelterDelete(data) {
        if (homePage.isShelterTabOpen())
            shelter.deletePost(data.postId);
    }

    static handlerShelterPostMessage(message) {
        if (homePage.isPostChatTabOpen() && shelter.isCurrentPost(message.postId)) {
            const statusClass = Utils.getStatusClass(message.status);
            Utils.displayMessage(message, statusClass);
        }
    }

    static async handlerPrivateMessage(message) {
        // ignore message not for current user
        if (!privateChatManager.shouldHandleMsg(message))
            return;
        console.log('Received private message: ', message);

        // case: is currently chatting to each other
        if (homePage.isPrivateMessageTabOpen() && privateChatManager.isCurrentlyChatting(message)) {
            const statusClass = Utils.getStatusClass(message.status);
            Utils.displayMessage(message, statusClass);
            await privateChatManager.postMarkMessagesReadFromChatTarget();
        }

        // case: in ESN directory
        if (homePage.isESNDirectoryTabOpen())
            await esnDirectory.updateUserDirectory();

        // case: in dms tab
        if (homePage.isDmsTabOpen())
            await esnDirectory.loadDms();
    }

    static async handlerResourceSharing(message) {
        if (homePage.isResourceSharingTabOpen())
            await resourceSharingHub.loadContents();
    }

    static async handlerUserUpdateStatus(data) {
        if (data.username === localStorage.getItem('username')) {
            localStorage.setItem('privilege', data.updatedProfile.privilege);
            if (homePage.isESNDirectoryTabOpen())
                await esnDirectory.updateUserDirectory();
            if (homePage.isAnnouncementTabOpen()) {
                if (data.updatedProfile.privilege === 'Administrator' || data.updatedProfile.privilege === 'Coordinator') {
                    document.getElementById('postMessageForm').style.display = 'block';
                } else {
                    document.getElementById('postMessageForm').style.display = 'none';
                }
                await homePage.loadTabContent(HomePage.getCurrentActiveTabName());
            }
        }
        if (data.updatedProfile.username !== '' && data.updatedProfile.username !== data.username) {
            if (data.username === localStorage.getItem('username')) {
                localStorage.setItem('username', data.updatedProfile.username);
                document.getElementById('usernameDisplay').textContent = `Hello, ${localStorage.getItem('username')}!`;
            }
            await homePage.loadTabContent(HomePage.getCurrentActiveTabName());
        }
    }

    static async handlerUserInactive(data) {
        if (data.username === localStorage.getItem('username')) {
            console.log('Received user inactive: ', data.username);
            $('#accountInactiveModal').modal('show');
        }
    }
}

const socketManager = new SocketManager();
