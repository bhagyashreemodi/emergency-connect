class PrivateChatManager {
    constructor() {
        this.currentUser = localStorage.getItem('username');
        this.chatTarget = null;
        this.initEventHandlers();
    }

    setChatTarget(username) {
        if (this.currentUser === username)  // not allowed to chat with oneself
            return false;
        this.chatTarget = username;
        console.log(`[PrivateChatManager] private chat target set to: ${username}`);
        return true;
    }

    /**
     * For now, each private message will be broadcast to all users.
     * Frontend should ignore those messages not intended for current user.
     */
    shouldHandleMsg(message) {
        // sender is current user OR receiver is current user
        const case1 = message.username === this.currentUser;
        const case2 = (this.currentUser != null) && (message.receiver === this.currentUser);
        return case1 || case2;
    }
    isCurrentlyChatting(message) {
        const case1 = (message.username === this.currentUser) && (message.receiver === this.chatTarget);
        const case2 = (this.currentUser != null) && (message.receiver === this.currentUser) && (message.username === this.chatTarget);
        return case1 || case2;
    }

    initEventHandlers() {
        $(document).ready(async () => {
            console.log(`PrivateChatManager ready (current user: ${this.currentUser})`);
        });
    }

    async loadContents() {
        if (!this.chatTarget) {
            console.error(`[PrivateChatManager] try to loadContents(), but this.chatTarget has not been set yet`);
            return;
        }

        $('#privateChatTarget').html(this.chatTarget);
        $('#messages').empty();

        let response = await axios.get(`/messages/private/${this.currentUser}/${this.chatTarget}`);
        let data = response.data || [];
        data.forEach(message => {
            const statusClass = Utils.getStatusClass(message.status);
            Utils.displayMessage(message, statusClass);
        });

        await this.postMarkMessagesReadFromChatTarget();

        $('#postMessageForm').off('submit').submit(() => {
            const msg = $('#messageInput').val();
            this.postMessage(msg);
        });
    }

    async postMessage(messageContent) {
        await axios.post('/messages/private', {
            "recipientUsername": this.chatTarget,
            "messageContent": messageContent
        });
        $('#messageInput').val('');
    }

    async postMarkMessagesReadFromChatTarget() {
        await axios.put('/messages/private/'+this.chatTarget+'/read');
    }

    closePrivateChatCallBack(tabNameToLoad) {
        return async () => {
            await homePage.loadTabContent(tabNameToLoad);
        }
    }
}

const privateChatManager = new PrivateChatManager();
