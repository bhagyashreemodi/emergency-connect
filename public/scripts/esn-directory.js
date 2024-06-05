class ESNDirectory {
    constructor() {
        this.getGeoLocation();
        this.currentEditUser = null;
    }

    async getGeoLocation() {
        navigator.geolocation.getCurrentPosition(async position => {
            const mapBoxToken = 'pk.eyJ1IjoiYW1hcm1yZiIsImEiOiJja3lwajB1ZHkwNncxMnZzanc2NGV4a2NyIn0.rVov2_bSlOezrNwJE_bH9g'
            mapboxgl.accessToken = mapBoxToken;
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            try {
                // Use Axios for the reverse geocoding request
                const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`, {
                    params: {
                        access_token: mapBoxToken,
                        types: 'address', // Optional: Helps to specify the result types you want
                    }
                });

                // Assuming 'place' represents the most relevant address feature
                const place = response.data.features[0];
                // Extract and format the address components
                this.addressComponents = this.getAddressComponents(place);

                console.log(this.addressComponents); // Output the structured address components
            } catch (error) {
                console.error('Error fetching address:', error);
            }
        });
    }

    async reinitEventHandlers() {
        if (this.isUserLoggedIn()) {
            await this.fetchAndDisplayUserInfo(); // Call it here
            this.initStatusChangeHandler();
        }
    }


    isUserLoggedIn() {
        return !!localStorage.getItem('username'); // Double negation '!!' to convert to boolean.
    }

    async fetchDirectory() {
        try {
            const response = await axios.get('/users');
            this.displayDirectory(response.data);
        } catch (error) {
            console.error("Failed to load directory list.", error);
        }
    }

    initStatusChangeHandler() {
        // Attach the event listener to a static parent element
        $('#tab-content').on('change', '#statusSelector', async (e) => {
            try {
                const newStatus = e.target.value;
                const username = localStorage.getItem('username');
                if (!username) throw new Error('Username not found in local storage.');
                // Use the provided Express route for updating status
                const apiUrl = `/users/${encodeURIComponent(username)}/status/${encodeURIComponent(newStatus)}`;
                const response = await axios.put(apiUrl);
                // Update the UI based on the new status
                this.updateStatusIndicator(newStatus);
                if (newStatus.toLowerCase() === 'emergency' || newStatus.toLowerCase() === 'help') {
                    await this.displayHelpModal(newStatus);
                }
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        });
    }

    async fetchAndDisplayUserInfo() {
        try {
            const username = localStorage.getItem('username');
            if (!username) throw new Error('Username not found in local storage.');

            const response = await axios.get(`/users/${encodeURIComponent(username)}`);

            if (response.data) {
                const userStatus = response.data.user.status; // Assuming 'status' is part of the response
                this.updateStatusIndicator(userStatus);
                const statusSelector = document.getElementById('statusSelector')
                if (statusSelector)
                    statusSelector.value = userStatus || 'Undefined';
            }
        } catch (error) {
            console.error('Failed to fetch user information:', error);
        }
    }

    updateStatusIndicator(status) {
        const statusIndicator = document.getElementById('statusIndicator');

        // Remove any existing status class
        if (statusIndicator) {
            statusIndicator.classList.remove('status-OK', 'status-Help', 'status-Emergency', 'status-Undefined');

            // Add the new status class
            const statusClass = `status-${status}`;
            statusIndicator.classList.add(statusClass);

            // Log the updated status for debugging purposes
            console.log(`Status updated to: ${status}`);
        }
    }

    updateOnlineCount() {
        const totalUsers = $('#esn-directory .directory-item').length; // Count all user elements
        const onlineUsers = $('#esn-directory .directory-status-online').length; // Count only online user elements
        $('#onlineCount span').text(`Online: ${onlineUsers}/${totalUsers}`);
    }



    displayDirectory(directoryData) {
        const directoryElement = $('#esn-directory'); // Make sure you have a container with this ID in your HTML
        const isAdmin = localStorage.getItem('privilege') === 'Administrator';
        directoryElement.empty(); // Clear existing directory list

        directoryData.forEach(user => {
            const alarmCSS = (user.unread === 0) ? 'visibility: hidden' : '';
            const editButtonHTML = isAdmin ? `<button type="button" class="btn btn-primary btn-sm status" onclick="esnDirectory.onAdminItemClicked('${user.username}');"">Edit</button>` : '';
            const userElement = `
                <div class="directory-item">
                    <div class="directory-item-header">
                        <span class="directory-username">${user.username}</span>
                        <span class="fa fa-bell" style="color: red; ${alarmCSS}"> ${user.unread}</span>
                        ${editButtonHTML}
                    </div>
                    <div class="directory-item-widget" onclick="esnDirectory.onDirectoryItemClicked($(this).parent().find('.directory-username').html());">
                        <span class="directory-status ${this.getStatusClass(user.status)}">${user.status}</span>
                        <span class="directory-status directory-status-${user.isOnline ? 'online' : 'offline'}">${user.isOnline ? 'online' : 'offline'}</span>
                    </div>
                </div>
            `;
            directoryElement.append(userElement);
        });
        this.updateOnlineCount();
    }

    async onDirectoryItemClicked(username) {
        console.log(`Directory Item Clicked: ${username}`);
        if (!homePage || !privateChatManager) {
            console.error(`[onUserClicked] homePage or privateChatManager not initialized`);
            return;
        }

        const isSuccess = privateChatManager.setChatTarget(username);
        if (!isSuccess) {
            alert('This is you.');
            return;
        }
        const tabNameToGoBack = HomePage.getCurrentActiveTabName();
        await homePage.loadTabContent('private-chat');

        $('#closePrivateChatBtn').on('click', privateChatManager.closePrivateChatCallBack(tabNameToGoBack));
    }

    async onAdminItemClicked(username) {
        $('#userProfileModal').find('#username').val('');
        $('#userProfileModal').find('#password').val('');
        $('#username-error').hide();
        $('#password-error').hide();
        this.currentEditUser = username;
        $('#userProfileModal').modal('show');
    }

    validateUserProfile() {
        const username = $('#username').val();
        const password = $('#password').val();
        let isValid = true;

        // Username must be at least 3 characters long.
        if (!this.validateUsername(username)) {
            $('#username-error').text('Username must be at least 3 characters long.').show();
            isValid = false;
        } else {
            $('#username-error').hide();
        }

        // Password must be at least 4 characters long.
        if (!this.validatePassword(password)) {
            $('#password-error').text('Password must be at least 4 characters long.').show();
            isValid = false;
        } else {
            $('#password-error').hide();
        }

        return isValid;
    }

    validateUsername(username) {
        return username.length >= 3 || username === '';
    }

    validatePassword(password) {
        return password.length >= 4 || password === '';
    }

    getUserProfileFormData() {
        const accountStatus = $('#accountStatus').val();
        const privilegeLevel = $('#privilegeLevel').val();
        const username = $('#username').val();
        const password = $('#password').val();

        return {
            username: username,
            password: password,
            isActive: accountStatus === 'Active' ? '1' : '0',
            privilege: privilegeLevel
        };
    }

    async submitUserProfileChanges() {
        const formData = this.getUserProfileFormData();
        const updatedUsername = this.currentEditUser;
        if (this.validateUserProfile()) {
            try {
                await $('#userProfileModal').modal('hide');
                const response = await axios.put(`/users/${encodeURIComponent(updatedUsername)}`, formData);
            } catch (error) {
                console.error('Profile update failed:', error);
                alert('Profile update failed. Please check the form for errors.');
            }
        } else {
            alert('Profile update failed. Please check the form for errors.');
        }
    }

    getStatusClass(status) {
        return `status-${status?.toLowerCase() ? status?.toLowerCase() : 'undefined'}`;
    }

    async updateUserDirectory() {
        await this.fetchDirectory();
        // Update the online count after the directory update is completed
        this.updateOnlineCount();
    }


    /*
     * ---------------------------- dms tab ----------------------------
     * Dms tab is simple and share some methods in common with ESN directory,
     * so Dms tab related methods are placed here.
     */
    async loadDms() {
        try {
            const response = await axios.get('/users');
            this.#displayDms(response.data);
        } catch (error) {
            console.error("Failed to load directory list.", error);
        }
    }

    #displayDms(directoryData) {
        const directoryElement = $('#dms'); // Make sure you have a container with this ID in your HTML
        directoryElement.empty(); // Clear existing directory list

        directoryData.forEach(user => {
            if (!user.chatted)
                return;
            const alarmCSS = (user.unread === 0) ? 'visibility: hidden' : '';
            const userElement = `
                <div class="directory-item" onclick="esnDirectory.onDirectoryItemClicked($(this).find('.directory-username').html());">
                    <div class="directory-item-header">
                        <span class="directory-username">${user.username}</span>
                        <span class="fa fa-bell" style="color: red; ${alarmCSS}"> ${user.unread}</span>
                    </div>
                    <div class="directory-item-widget">
                        <span class="directory-status ${this.getStatusClass(user.status)}">${user.status}</span>
                        <span class="directory-status directory-status-${user.isOnline ? 'online' : 'offline'}">${user.isOnline ? 'online' : 'offline'}</span>
                    </div>
                    <p>${user.lastMessage}</p>
                </div>
            `;
            directoryElement.append(userElement);
        });
        this.updateOnlineCount();
    }

    async displayHelpModal(newStatus) {
        $('#needHelpModal').modal('show');
        const username = localStorage.getItem('username');
        $('#submitHelpRequest').on('click', async () => {
            const title = username + ' is in ' + newStatus;
            let skill = $('#skills').val();
            const helpMessage = 'I am in critical need of volunteer with skill ' + skill;
            const newVolunteerTask = {
                // Assuming form fields with respective IDs exist in your modal
                assignee: '', // Set accordingly
                title: title,
                helpMessage: helpMessage,
                fullAddress: this.addressComponents.fullAddress,
                city: this.addressComponents.city,
                state: this.addressComponents.state,
                zipCode: this.addressComponents.zipCode,
                status: 'OPEN',
                skill: skill
            };
            console.log('New task:', newVolunteerTask);

            await axios.post('/volunteers/tasks', newVolunteerTask);
            $('#needHelpModal').modal('hide');
        });

    }

    getAddressComponents(place) {
        let address = {
            fullAddress: place.place_name,
            city: '',
            state: '',
            zipCode: '',
            country: ''
        };

        // Iterate over the context array to extract specific components
        place.context.forEach(component => {
            if (component.id.startsWith('place')) {
                address.city = component.text;
            } else if (component.id.startsWith('region')) {
                address.state = component.text;
            } else if (component.id.startsWith('postcode')) {
                address.zipCode = component.text;
            } else if (component.id.startsWith('country')) {
                address.country = component.text;
            }
        });
        return address;
    }
}

const esnDirectory = new ESNDirectory();