class VolunteerManagement {
    constructor() {
        console.log("VolunteerManagement constructor called");
        this.currentUser = localStorage.getItem('username');
        this.isUpdate = false;
    }

    initializeEventListeners() {
        console.log("Initializing event listeners for VolunteerManagement");
        $(document).ready(() => {
           $('#registerVolunteerBtn').click(async () => {
               console.log("Register volunteer button clicked");
               this.isUpdate = false;
               await this.loadRegisterVolunteerForm();
           });
           $('#volunteerProfileUpdateBtn').click(async () => {
               console.log("Update volunteer button clicked");
               this.isUpdate = false;
               await this.loadUpdateForm();
           });
           $('#volunteerUnRegisterBtn').click(async () => {
               console.log("UnRegister volunteer button clicked");
               await this.handleDeRegister();
           });
           $('#volunteerAssignmentsBtn').click(async () => {
               console.log("get assigned tasks button clicked");
               await this.viewAssignedTasks();
           });
           $('#volunteerMgmntBack').click(async () => {
               await homePage.loadTabContent('resources');
           });

        })
    }

    async loadRegisterVolunteerForm() {
        console.log("Loading volunteer registration form");
        let volunteerGetResponse = await axios.get('/volunteers/' + encodeURIComponent(this.currentUser));
        console.log(volunteerGetResponse);
        if (volunteerGetResponse.data === '') {
            let response = await axios.get('/volunteer-profile');
            $('#tab-content').html(response.data);
            this.bindRegisterVolunteerFormEventListeners();
            this.populateDefaultValues();
        }
        else {
            console.log("User is already registered as a volunteer");
            $("#volunteerMgmntModalMessage").text("The user is already registered as Volunteer. You can update/delete the profile.");
            $('#volunteerMgmntModal').modal('show');
        }
    }

    bindRegisterVolunteerFormEventListeners() {
        $('#registerForm').submit(async () => {
            await this.submitVolunteerProfile();
        })
        $('#volunteerProfileMgmntBack').click(async () => {
            console.log("Back button clicked");
            await homePage.loadTabContent('volunteer-management');
        });
        $('#volunteerMgmntModalClose').off('click').on('click',async () => {
            await homePage.loadTabContent('volunteer-management');
        });

    }

    async submitVolunteerProfile() {
        const inputData = this.getFormData();
        if(this.isUpdate) {
            this.updateProfile(inputData);
        }
        else {
            this.registerNewProfile(inputData);
        }
    }

    registerNewProfile(inputData) {
        axios.post('/volunteers', inputData)
            .then(function (response) {
                console.log('Registration successful', response.data);
                $("#volunteerMgmntModalMessage").text("Thank you for registering as a volunteer! We really appreciate your help.");
                $('#volunteerMgmntModal').modal('show');
            })
            .catch(function (error) {
                console.error('Registration failed', error);
                $("#volunteerMgmntModalMessage").text("Registration failed! Please try again.");
                $('#volunteerMgmntModal').modal('show');
            });
    }

    getFormData() {
        return {
            username: this.currentUser,
            firstName: $('#firstName').val(),
            lastName: $('#lastName').val(),
            city: $('#city').val(),
            state: $('#stateInput').val(),
            zipCode: $('#zipCode').val(),
            skills: $('#skills').val(), // Assuming this is a multi-select
            phoneNumber: $('#phoneNumber').val(),
            availability: $('#availability').val(), // Assuming this is a multi-select
            consent: $('#smsConsent').is(':checked') // Assuming this is a checkbox
        };
    }

    async loadUpdateForm() {
        console.log("Loading volunteer update form");
        let volunteerGetResponse = await axios.get('/volunteers/' + encodeURIComponent(this.currentUser));
        console.log(volunteerGetResponse);
        if (volunteerGetResponse.data === '') {
            console.log("User is not registered as a volunteer");
            $("#volunteerMgmntModalMessage").text("The user is not registered as Volunteer. Please register first.");
            $('#volunteerMgmntModal').modal('show');
        }
        else {
            let response = await axios.get('/volunteer-profile');
            $('#tab-content').html(response.data);
            this.populateData(volunteerGetResponse.data);
            this.bindRegisterVolunteerFormEventListeners();

        }
    }

    populateData(volunteerData) {
        $('#firstName').val(volunteerData.firstName);
        $('#lastName').val(volunteerData.lastName);
        $('#city').val(volunteerData.city);
        $('#stateInput').val(volunteerData.state);
        $('#zipCode').val(volunteerData.zipCode);
        $('#skills').val(volunteerData.skills); // Assuming this is a multi-select
        $('#phoneNumber').val(volunteerData.phoneNumber);
        $('#availability').val(volunteerData.availability); // Assuming this is a multi-select
        $('#smsConsent').prop('checked', volunteerData.consent); // Assuming this is a checkbox
        $('#firstName').val(volunteerData.firstName).prop('readonly', true); // Readonly
        $('#lastName').val(volunteerData.lastName).prop('readonly', true); // Readonly
        this.isUpdate = true;
    }

    updateProfile(inputData) {
        axios.put('/volunteers/', inputData)
            .then(function (response) {
                console.log('Update successful', response.data);
                $("#volunteerMgmntModalMessage").text("Profile updated successfully.");
                $('#volunteerMgmntModal').modal('show');
            })
            .catch(function (error) {
                console.error('Update failed', error);
                $("#volunteerMgmntModalMessage").text("Profile update failed! Please try again.");
                $('#volunteerMgmntModal').modal('show');
            });
    }

    async handleDeRegister() {
        console.log("Handling volunteer de-registration");
        axios.delete('/volunteers/' + encodeURIComponent(this.currentUser))
            .then(function (response) {
                console.log('De-registration successful', response.data);
                $("#volunteerMgmntModalMessage").text("Volunteer profile deleted successfully.");
                $('#volunteerMgmntModal').modal('show');
            })
            .catch(function (error) {
                console.error('De-registration failed', error);
                $("#volunteerMgmntModalMessage").text("Volunteer profile deletion failed! Please try again.");
                $('#volunteerMgmntModal').modal('show');
            });
    }

    async viewAssignedTasks() {
        console.log("Viewing assigned tasks");
        $('#taskContainer').innerHTML = '';
        let volunteerAssignedTasksResponse = await axios.get('/volunteers/' + encodeURIComponent(this.currentUser) + '/tasks');
        let volunteerOpenTasksResponse;
        try {
            volunteerOpenTasksResponse = await axios.get('/volunteers/tasks/OPEN');
        } catch (error) {
            console.error('Error fetching open tasks', error);
            $("#volunteerMgmntModalMessage").text("Volunteer tasks retrieval is invalid!");
            $('#volunteerMgmntModal').modal('show');
            return;
        }
        let response = await axios.get('/volunteer-tasks-management');
        $('#tab-content').html(response.data);
        const volunteerTasks = [];
        volunteerTasks.push(...volunteerAssignedTasksResponse.data);
        volunteerTasks.push(...volunteerOpenTasksResponse.data);
        for (let i = 0; i < volunteerTasks.length; i++) {
            this.displayTask(volunteerTasks[i], i);
        }
        this.bindTasksPageEventListeners(volunteerTasks);
    }

    bindTasksPageEventListeners(volunteerTasks) {
        $('#volunteerProfileMgmntBack').click(async () => {
            console.log("Back button clicked");
            await homePage.loadTabContent('volunteer-management');
        });
        this.bindAcceptMethod(volunteerTasks);
        this.bindDeclineMethod(volunteerTasks);
        $('#volunteerMgmntModalClose').off('click').on('click',async () => {
            await this.viewAssignedTasks();
            $('#volunteerMgmntModal').modal('hide');
        });
    }

    bindAcceptMethod(volunteerTasks) {
        $('#taskContainer').on('click', '.accept-btn', function () {
            const taskIndex = $(this).data('task-index');
            console.log(`Accepted Task ID: ${volunteerTasks[taskIndex].title}`);
            axios.put('/volunteers/' + this.currentUser + '/tasks/' + encodeURIComponent(volunteerTasks[taskIndex].title)+ '/ACCEPTED')
                .then(function (response) {
                    console.log('Task accepted successfully', response.data);
                    publicWall.postMessage(`I have accepted the volunteering task of providing help for ${volunteerTasks[taskIndex].skill} at ${volunteerTasks[taskIndex].fullAddress}`)
                        .then(r => console.log('Posted to public wall'))
                    $("#volunteerMgmntModalMessage").text("Task accepted successfully.");
                    $('#volunteerMgmntModal').modal('show');
                })
                .catch(function (error) {
                    console.error('Task acceptance failed', error);
                    $("#volunteerMgmntModalMessage").text("Task acceptance failed! Please try again.");
                    $('#volunteerMgmntModal').modal('show');
                });
        });
    }

    displayTask(task, index) {
        const buttonsHtml = task.status.toLowerCase() !== 'accepted' ? `
        <button class="btn btn-success accept-btn" data-task-index="${index}">Accept</button>
        <button class="btn btn-danger decline-btn" data-task-index="${index}">Decline</button>
        ` : '';

        const taskHtml = `
        <div class="card mb-2">
            <div class="card-body">
                <h5 class="card-title">${task.title}</h5>
                <p class="card-text">${task.helpMessage}</p>
                <p class="card-text">Address: ${task.fullAddress}</p>
                <p class="card-text">Status: ${task.status.toLowerCase() === 'declined' ? 'OPEN' : task.status} </p>
                <p class="card-text">Posted Time: ${Utils.formatTimestamp(task.timestamp)}</p>
                ${buttonsHtml}
            </div>
        </div>`;
        $('#taskContainer').append(taskHtml);
    }

    bindDeclineMethod(volunteerTasks) {
        $('#taskContainer').on('click', '.decline-btn', function () {
            const taskIndex = $(this).data('task-index');
            console.log(`Declined Task ID: ${volunteerTasks[taskIndex].title}`);
            axios.put('/volunteers/' + this.currentUser + '/tasks/' + volunteerTasks[taskIndex].title + '/DECLINED')
                .then(function (response) {
                    console.log('Task declined successfully', response.data);
                    $("#volunteerMgmntModalMessage").text("Task declined successfully.");
                    $('#volunteerMgmntModal').modal('show');
                })
                .catch(function (error) {
                    console.error('Task decline failed', error);
                    $("#volunteerMgmntModalMessage").text("Task decline failed! Please try again.");
                    $('#volunteerMgmntModal').modal('show');
                });
        });
    }

    populateDefaultValues() {
        const addressComponents = esnDirectory.addressComponents;
        $('#city').val(addressComponents.city);
        $('#stateInput').val(addressComponents.state);
        $('#zipCode').val(addressComponents.zipCode);
    }
}

let volunteerManagement = new VolunteerManagement();