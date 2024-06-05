class PublicWall {
    constructor() {
        this.initEventHandlers();
    }

    initEventHandlers() {
        $(document).ready(async () => {
           console.log("Public wall ready")
        });
    }

    async fetchMessages() {
        $('#messages').empty();
        let response = await axios.get('/messages/public');
        let data = response.data || [];
        data.forEach(message => {
            const statusClass = Utils.getStatusClass(message.status);
            Utils.displayMessage(message, statusClass);
        });

        $('#postMessageForm').submit(() => {
            const msg = $('#messageInput').val();
            this.postMessage(msg);
        });
    }


    async postMessage(messageContent) {
        await axios.post('/messages/public', {messageContent});
        $('#messageInput').val('');
    }
}
const publicWall = new PublicWall();
