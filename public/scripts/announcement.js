class Announcement {
    constructor() {
        this.initEventHandlers();
    }

    initEventHandlers() {
        $(document).ready(async () => {
            console.log("Announcement ready");
        });
    }

    async retrieveAnnouncement() {
        $('#messages').empty();
        let privilege = localStorage.getItem('privilege');
        if (privilege === 'Citizen') {
            document.getElementById('postMessageForm').style.display = 'none';
        }
        let response = await axios.get('/announcements');
        let data = response.data || [];
        data.forEach(message => {
          Utils.displayMessage(message);
        });

        $('#postMessageForm').submit(() => {
            const msg = $('#messageInput').val();
            this.postAnnouncement(msg);
        });
    }

    async postAnnouncement(announcementContent) {
        console.log(announcementContent);
        await axios.post('/announcements', { announcementContent });
        $('#messageInput').val('');
    }
}

const announcement = new Announcement();