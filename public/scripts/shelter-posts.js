class Shelter {
    constructor() {
        this.initEventHandlers();
        this.currentPostId = null;
    }

    initEventHandlers() {
        $(document).ready(async () => {
            console.log("Shelter Posts ready");
        });
    }

    async retrieveShelterPosts() {
        this.currentPostId = null;
        localStorage.removeItem('currentPostId');
        const response = await axios.get('/shelters');
        const data = response.data || [];
        console.log(data);
        $('#messages').empty();
        data.forEach((message) => this.displayMessage(message));

        $(document).on('click', (e) => {
            if (!$(e.target).closest('.message-actions').length) {
                $('.menu-dropdown').hide();
            }
        });

        $('#photoInput').change((e) => {
            const input = e.target;
            if (input.files && input.files.length > 0) {
                $('#uploadTrigger i').removeClass('fas fa-image').addClass('fas fa-check');
            }
        });

        $('#postMessageForm').submit(async (e) => {
            e.preventDefault();
            if ($('#photoInput').get(0).files.length !== 1) {
                alert('Please upload exactly one photo for the post.');
                return;
            }

            const msg = $('#messageInput').val();
            const photo = $('#photoInput').get(0).files[0];
            await this.postShelter(msg, photo);
        });
    }

    async clickPost(event, element) {
        if ($(event.target).closest('.message-actions').length) {
            return; // Ignore clicks on the action buttons
        }
        const postId = $(element).closest('.chat-message').data('post-id');
        console.log("Post clicked:", postId);
        this.currentPostId = postId; // Store the current post ID
        localStorage.setItem('currentPostId', postId);
        await homePage.loadTabContent('post-chat');
    }

    async loadPostChatContents() {
        this.currentPostId = localStorage.getItem('currentPostId');
        console.log("Load current postId:", this.currentPostId);
        $('#messages').empty();
        const response = await axios.get(`/shelters/${this.currentPostId}/message`);
        const data = response.data || [];
        console.log(data);
        data.forEach(message => {
            const statusClass = Utils.getStatusClass(message.status);
            Utils.displayMessage(message, statusClass);
        });

        $('#postMessageForm').submit(async (e) => {
            e.preventDefault();

            const msg = $('#messageInput').val();
            console.log("Message:", msg);
            try {
                await this.postMessage(msg);
            } catch (error) {
                console.error('Error posting message:', error);
            }
        });
        $('#closePostChatBtn').on('click', this.closePostChatCallBack());
    }

    async postMessage(messageContent) {
        await axios.post(`/shelters/${this.currentPostId}/message`, { messageContent });
        $('#messageInput').val('');
    }

    async deleteHandler(e) {
        const postId = $(e.target).closest('.chat-message').data('post-id');
        try {
            await axios.delete(`/shelters/${postId}`);
            $(e.target).closest('.chat-message').remove();
        } catch (error) {
            // if the status code is 401
            if (error.response.status === 401) {
                alert("Delete failed: Unauthorized");
            } else {
                alert("Delete failed: " + error.message);
            }
        }
    }

    async updateHandler(e) {
        console.log("Update clicked");
        const postId = $(e.target).closest('.chat-message').data('post-id');
        $('#modalMessageInput').val('');

        var oldInput = $('#modalPhotoInput');
        oldInput.replaceWith(oldInput.val('').clone(true));

        $('#postMessageModal').data('post-id', postId);
        $('#modalUploadTrigger i').removeClass('fas fa-check').addClass('fas fa-image');
        $('#postMessageModal').modal('show');
        $('#modalPhotoInput').change((e) => {
            const input = e.target;
            if (input.files && input.files.length > 0) {
                $('#modalUploadTrigger i').removeClass('fas fa-image').addClass('fas fa-check');
            }
        });
    }

    async updateTrigger() {
        const postId = $('#postMessageModal').data('post-id');
        console.log("Update Trigger:", postId);
        if ($('#modalMessageInput').val() === '' && $('#modalPhotoInput').get(0).files.length !== 1) {
            alert('Please enter message or image to update.');
            return;
        }
        try {
            const msg = $('#modalMessageInput').val();
            const photo = $('#modalPhotoInput').get(0).files[0];
            await this.updatePost(postId, msg, photo);

        } catch (error) {
            if (error.response.status === 401) {
                alert("Update failed: Unauthorized");
            } else {
                alert("Update failed: " + error.message);
            }
        }
    }

    menuHandler(event) {
        $(event.target).closest('.chat-message').find('.menu-dropdown').toggle();
    }

    async updatePost(postId, msg, photo) {
        console.log(postId, msg, photo);
        const formData = new FormData();
        // if(msg)
        formData.append('msg', msg);
        // if(photo)
        formData.append('photo', photo);

        await axios.put(`/shelters/${postId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Clear inputs and reset icon only if submission is successful
        $('#messageInput').val('');
        $('#uploadTrigger i').removeClass('fas fa-check').addClass('fas fa-image');
        $('#photoInput').val('');
    }

    async postShelter(msg, photo) {
        console.log(msg);
        const formData = new FormData();
        formData.append('msg', msg);
        formData.append('photo', photo);

        await axios.post('/shelters', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        // Clear inputs and reset icon only if submission is successful
        $('#messageInput').val('');
        $('#uploadTrigger i').removeClass('fas fa-check').addClass('fas fa-image');
        $('#photoInput').val('');
    }

    isCurrentPost(postId) {
        console.log("Current Post ID:", this.currentPostId);
        console.log("Post ID:", postId);
        return this.currentPostId === postId;
    }

    displayMessage(message) {
        const messageElement = `
            <div class="chat-message" data-post-id="${message.postId}">
                <div class="message-header">
                    <span class="username">${message.username}</span>
                    <!-- Three-dot menu button -->
                    <div class="message-actions">
                        <button class="menu-button" onclick="shelter.menuHandler(event)">...</button>
                        <div class="menu-dropdown">
                            <ul>
                                <li><button class="update-btn" onclick="shelter.updateHandler(event)">Update</button></li>
                                <li><button class="delete-btn" onclick="shelter.deleteHandler(event)">Delete</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="message-body clickable-area" onclick="shelter.clickPost(event, this)">
                    <div class="message-text">${message.message}</div>
                    <!-- Photo section -->
                    <div class="message-photo">
                        <img src="${message.imgUrl}" alt="shelter photo" style="max-width: 100%; height: auto;">
                    </div>
                </div>
                <div class="message-timestamp">
                    <span class="timestamp">${Utils.formatTimestamp(message.timestamp)}</span>
                </div>
            </div>
        `;

        // $('#messages').empty();
        const msgList = $('#messages');
        msgList.append(messageElement);
        setTimeout(() => {
            msgList.scrollTop(msgList[0].scrollHeight);
        }, 0);
    }

    deletePost(postId) {
        $(`div[data-post-id='${postId}']`).remove();
    }

    updateContent(postId, msg, photo) {
        console.log(postId, msg, photo);
        console.log("Updating content");
        const message = $(`div[data-post-id='${postId}']`);
        message.find('.message-text').text(msg);
        if (photo) {
            message.find('.message-photo img').attr('src', photo);
        }
    }

    closePostChatCallBack() {
        return async () => {
            await homePage.loadTabContent('shelter');
        }
    }

    async closeShelterCallBack() {
        console.log("Close shelter clicked");
        await homePage.loadTabContent('resources');
    }

}

const shelter = new Shelter();