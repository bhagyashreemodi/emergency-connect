class IncidentMap {
    constructor() {
        this.map = null;
        this.incidents = [];
        this.cancelBtn = null;
        this.deleteConfirmationModal = null;
        this.newIncidentMarker = null;
        this.isAddingIncident = false;
        this.modalMode = 'create';
        this.initEventHandlers();
    }

    initEventHandlers() {
        $(document).ready(async () => {
            if (this.isUserLoggedIn()) {
                console.log("User is logged in.");
                $(document).on('incident-map-loaded', () => {
                    this.showSuccessMessage('Loading incidents...');
                    this.initMap();
                });
            }
        });
    }

    isUserLoggedIn() {
        return !!localStorage.getItem('username');
    }

    async retrieveIncidents() {
        console.log("Retrieving incidents...");
        try {
            const response = await axios.get('/incidents');
            this.incidents = response.data || [];
            this.incidents.forEach(incident => {
                this.renderIncident(incident);
            });
        } catch (error) {
            console.error('Error retrieving incidents:', error);
        }
    }

    initMap() {
        this.setupMap();
        this.handleGeolocation();
        this.initializeMapEventHandlers();
    }

    setupMap() {
        mapboxgl.accessToken = 'pk.eyJ1IjoiYW1hcm1yZiIsImEiOiJja3lwajB1ZHkwNncxMnZzanc2NGV4a2NyIn0.rVov2_bSlOezrNwJE_bH9g';
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            zoom: 12
        });
        $('#incidentActionBtn').prop('disabled', true);
    }
    
    handleGeolocation() {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.map.setCenter([longitude, latitude]);
                this.showUserLocation();
                $('#incidentActionBtn').prop('disabled', false);
                $('#successToast').toast('hide');
            },
            (error) => {
                console.error('Error getting user location:', error);
                this.map.setCenter([-122.4194, 37.7749]); // Set a default location (San Francisco)
                this.showLocationErrorMessage();
                $('#incidentActionBtn').prop('disabled', false);
                $('#successToast').toast('hide');
            }
        );
    }
    
    initializeMapEventHandlers() {
        this.map.on('load', () => {
            console.log("Map loaded...");
            this.initMapMoveEventHandlers();
            this.retrieveIncidents();
            this.initDeleteConfirmationModal();
            this.initAddIncidentButton();
        });
    }

    showUserLocation() {
        this.geolocateControl = new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        });
        this.map.addControl(this.geolocateControl);
        this.map.addControl(new mapboxgl.NavigationControl());
        //location.reload();

        if (this.geolocateControl._watchState === 'OFF') {
            this.geolocateControl.trigger();
        }
    }
    
    initMapMoveEventHandlers() {
        this.map.on('move', () => {
            // console.log("Map moved...");
            if (this.isAddingIncident && this.newIncidentMarker) {
                const center = this.map.getCenter();
                this.newIncidentMarker.setLngLat(center);
            }
        });
    }
    
    showLocationErrorMessage() {
        const toast = $('#successToast');
        toast.find('.toast-body').text('Unable to get your location. Using default location.');
        toast.toast('show');
    }

    renderIncident(incident) {
        console.log("Rendering incidents... " + incident._id);
        const marker = this.createMarker(incident);
        const popup = this.createPopup(incident);
        marker.setPopup(popup);
        incident.marker = marker;
    }

    createMarker(incident) {
        console.log("Creating marker...");
        const markerColor = this.getMarkerColor(incident.status);
        return new mapboxgl.Marker({ color: markerColor })
            .setLngLat(incident.location.coordinates)
            .addTo(this.map);
    }

    getMarkerColor(status) {
        switch (status) {
            case 'Resolved':
                return 'gray';
            case 'Active':
                return 'red';
            case 'In Progress':
                return 'blue';
            default:
                return 'red';
        }
    }

    createPopup(incident) {
        console.log("Creating popup...");
        const popup = new mapboxgl.Popup({ offset: 10, maxWidth: '240px' })
            .setHTML(this.getPopupHTML(incident));
        this.attachPopupEventListeners(popup, incident);
        return popup;
    }
    
    getPopupHTML(incident) {
        return `
            <div>
                <span>Created: ${moment(incident.timestamp).fromNow()}</span>
                <h5>${incident.type}</h5>
                <p style="word-wrap: break-word;">${incident.description}</p>
                ${this.getStatusSelectHTML(incident)}
                <div class="form-group">
                    <span>Severity: ${incident.severity}</span>
                </div>
                ${this.getActionButtonsHTML(incident)}
                ${this.getReportedByHTML(incident)}
            </div>
        `;
    }
    
    getStatusSelectHTML(incident) {
        return `
            <div class="form-group d-flex justify-content-between align-items-center mt-1">
                <label class="mt-2" for="status-${incident._id}">Status:</label>
                <select id="status-${incident._id}" class="form-control form-control-sm ml-2">
                    <option value="Active" ${incident.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="In Progress" ${incident.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Resolved" ${incident.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                </select>
            </div>
        `;
    }
    
    getActionButtonsHTML(incident) {
        return `
            <div class="d-flex justify-content-between">
                <button class="btn btn-danger btn-sm delete-incident" data-incident-id="${incident._id}">Delete</button>
                <span class="edit-incident" data-incident-id="${incident._id}">Edit</span>
            </div>
        `;
    }
    
    getReportedByHTML(incident) {
        return `
            <div class="d-flex justify-content-between">
                <small class="mr-2">Reported by: ${incident.reportedBy.username}</small>
                ${incident.lastEditedBy.username ? `<small>Last edited by: ${incident.lastEditedBy.username}</small>` : ''}
            </div>
        `;
    }

    attachPopupEventListeners(popup, incident) {
        console.log("Attaching popup event listeners...");
        popup.on('open', () => {
            $(`#status-${incident._id}`).on('change', async (e) => {
                const newStatus = $(e.target).val();
                await this.updateIncidentStatus(incident._id, newStatus);
            });

            $('.edit-incident').on('click', (e) => {
                const incidentId = $(e.target).data('incident-id');
                this.openEditIncidentModal(incidentId);
            });

            $('.delete-incident').on('click', (e) => {
                const incidentId = $(e.target).data('incident-id');
                console.log(incidentId);
                this.deleteIncident(incidentId);
            });
        });
    }

    initAddIncidentButton() {
        const incidentActionBtn = $('#incidentActionBtn');
        this.cancelBtn = $('<button>').attr('id', 'cancelIncidentBtn').addClass('btn btn-secondary mt-2').text('Cancel');
      
        incidentActionBtn.on('click', this.handleIncidentActionBtnClick.bind(this));
        $('#incidentDescription').on('input', this.handleIncidentDescriptionInput);
        $('#incidentDescription').on('keypress', this.handleIncidentDescriptionKeypress);
        $('#saveIncidentBtn').on('click', this.handleSaveIncidentBtnClick.bind(this));
        $('#addIncidentModal').on('hidden.bs.modal', this.handleAddIncidentModalHidden.bind(this));
    }
      
    handleIncidentActionBtnClick() {
      if (this.isAddingIncident) {
        console.log("Location selected");
        const center = this.map.getCenter();
        $('#incident-location').val(center.lng + ',' + center.lat);
        $('#addIncidentModalLabel').text('Add Incident');
        this.modalMode = 'create';
        this.resetIncidentFormFields();
        $('#addIncidentModal').modal('show');
      } else {
        this.startAddingIncident();
      }
    }
    
    handleIncidentDescriptionInput() {
      const descriptionLength = $('#incidentDescription').val().length;
      const remainingChars = 140 - descriptionLength;
      if (remainingChars <= 30) {
        $('#descriptionCount').text(`${remainingChars} characters remaining`).show();
      } else {
        $('#descriptionCount').hide();
      }
    }
    
    handleIncidentDescriptionKeypress(event) {
      const descriptionLength = $('#incidentDescription').val().length;
      const remainingChars = 140 - descriptionLength;
      if (remainingChars <= 0 && event.which !== 8 && event.which !== 46) {
        event.preventDefault();
      }
    }
    
    async handleSaveIncidentBtnClick() {
      const incidentData = this.getIncidentFormData();
      const { isValid, errors } = this.validateIncidentData(incidentData);
      if (isValid) {
        await this.saveIncident(incidentData);
        $('#addIncidentModal').modal('hide');
        this.resetIncidentForm();
      } else {
        this.displayValidationErrors(errors);
      }
    }

    async saveIncident(incidentData) {
        if (this.modalMode === 'create') {
            await this.addIncident(incidentData);
        } else if (this.modalMode === 'update') {
            const incidentId = $('#addIncidentModal').data('incidentId');
            await this.updateIncident(incidentId, incidentData);
        }
    }
    
    handleAddIncidentModalHidden() {
      if (this.modalMode === 'create') {
        // this.startAddingIncident();
        // this.cancelAddIncident();
      } else {
        console.log("Modal mode is updated...");
        this.cancelAddIncident();
      }
      this.resetIncidentForm();
    }
    
    resetIncidentForm() {
      $('#addIncidentForm')[0].reset();
      $('#descriptionCount').text('').hide();
      $('.error-message').text('');
    }

    resetIncidentFormFields() {
        $('#incidentType').val('');
        $('#incidentDescription').val('');
        $('#incidentStatus').val('Active');
        $('#incidentSeverity').val('');
    }

    startAddingIncident() {
        console.log("Adding incident...");
        this.isAddingIncident = true;
        const center = this.map.getCenter();
        this.newIncidentMarker = new mapboxgl.Marker()
            .setLngLat(center)
            .addTo(this.map);
        $('#incidentActionBtn').text('Select this location');
        $('#incidentActionBtn').after(this.cancelBtn);
        this.cancelBtn.on('click', () => {
            this.cancelAddIncident();
        });
    }

    cancelAddIncident() {
        console.log("Adding canceled...");
        this.isAddingIncident = false;
        $('#incidentActionBtn').text('Report an Incident');
        this.cancelBtn.remove();
        if (this.newIncidentMarker) {
            this.newIncidentMarker.remove();
        }
    }

    getIncidentFormData() {
        console.log("Getting incident form data...");
        const type = $('#incidentType').val();
        const description = $('#incidentDescription').val();
        const status = $('#incidentStatus').val();
        const severity = $('#incidentSeverity').val();

        const location = this.map.getCenter();
        const lng = location.lng;
        const lat = location.lat;
        const reportedBy = localStorage.getItem('username');

        return {
            type,
            description,
            location: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            reportedBy,
            status,
            severity
        };
    }

    async addIncident(incident) {
        try {
            const { isValid, errors } = this.validateIncidentData(incident);

            if (!isValid) {
                this.displayValidationErrors(errors);
                return;
            }

            console.log("Adding incident..." + incident);
            const response = await axios.post('/incidents', incident);
            const newIncident = response.data.incident;
            this.incidents.push(newIncident);
            this.renderNewIncident(newIncident);
            this.resetAddIncidentForm();
            this.showSuccessMessage('Incident added');
            this.modalMode = 'update';
        } catch (error) {
            console.error('Error adding incident:', error);
        }
    }

    renderNewIncident(incident) {
        const marker = this.createMarker(incident);
        const popup = this.createPopup(incident);
        marker.setPopup(popup);
        incident.marker = marker;
        this.attachPopupEventListeners(popup, incident);
    }
    
    resetAddIncidentForm() {
        $('#addIncidentModal').modal('hide');
        $('#addIncidentForm')[0].reset();
        this.cancelAddIncident();
    }
    
    validateIncidentData(incident) {
        const errors = {};
        let isValid = true;

        if (!incident.type) {
            errors.type = 'Please select an incident type.';
            isValid = false;
        }

        if (!incident.description || incident.description.length < 4) {
            errors.description = 'Description must be at least 4 characters long.';
            isValid = false;
        }

        if (incident.description && incident.description.length > 140) {
            errors.description = 'Description must be at max 140 characters long.';
            isValid = false;
        }

        if (!incident.status) {
            errors.status = 'Please select an incident status.';
            isValid = false;
        }

        if (!incident.severity) {
            errors.severity = 'Please select an incident severity.';
            isValid = false;
        }

        return { isValid, errors };
    }

    displayValidationErrors(errors) {
        $('#typeError').text(errors.type || '');
        $('#descriptionError').text(errors.description || '');
        $('#statusError').text(errors.status || '');
        $('#severityError').text(errors.severity || '');
    }

    async deleteIncident(incidentId) {
        $('#deleteConfirmationModal').modal('show');
        $('#confirmDeleteBtn').off('click').on('click', async () => {
            try {
                const response = await axios.delete(`/incidents/${incidentId}`);
                if (response.status === 200) {
                    this.removeIncidentFromMap(incidentId);
                    this.incidents = this.incidents.filter(incident => incident._id !== incidentId);
                    $('#deleteConfirmationModal').modal('hide');
                    this.showSuccessMessage('Incident deleted');
                } else {
                    console.error('Failed to delete incident:', response.status);
                }
            } catch (error) {
                console.error('Error deleting incident:', error);
            }
        });
    }
    
    removeIncidentFromMap(incidentId) {
        const deletedIncident = this.incidents.find(incident => incident._id === incidentId);
        if (deletedIncident && deletedIncident.marker) {
            deletedIncident.marker.remove();
        }
    }
    
    showSuccessMessage(message) {
        const toast = $('#successToast');
        toast.find('.toast-body').text(message);
        toast.toast('show');
    }

    initDeleteConfirmationModal() {
        this.deleteConfirmationModal = $('<div>').addClass('modal fade').attr('id', 'deleteConfirmationModal').attr('tabindex', '-1').attr('role', 'dialog').html(`
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Confirm Deletion</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>Are you sure you want to delete this incident?</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
                    </div>
                </div>
            </div>
        `);
        $('body').append(this.deleteConfirmationModal);
    }

    async updateIncidentStatus(incidentId, newStatus) {
        try {
            const response = await axios.put(`/incidents/${incidentId}`, { status: newStatus });
            if (response.status === 200) {
                const updatedIncident = response.data.incident;
                this.updateIncidentInMap(updatedIncident);
                this.showSuccessMessage('Incident status updated');
            } else {
                console.error('Failed to update incident status:', response.status);
            }
        } catch (error) {
            console.error('Error updating incident status:', error);
        }
    }

    updateIncidentInMap(updatedIncident) {
        const incident = this.incidents.find(incident => incident._id === updatedIncident._id);
        if (incident) {
            incident.lastEditedBy.username = localStorage.getItem('username');
            incident.status = updatedIncident.status;
            incident.marker.remove();
            this.renderIncident(incident);
        }
    }
    
    async openEditIncidentModal(incidentId) {
        const incident = this.incidents.find(incident => incident._id === incidentId);
        if (incident) {
            this.modalMode = 'update';
            $('#addIncidentModalLabel').text('Edit Incident');
            this.populateIncidentFormFields(incident);
            $('#addIncidentModal').data('incidentId', incidentId);
            $('#addIncidentModal').modal('show');
        }
    }

    populateIncidentFormFields(incident) {
        $('#incidentType').val(incident.type);
        $('#incidentDescription').val(incident.description);
        $('#incidentStatus').val(incident.status);
        $('#incidentSeverity').val(incident.severity);
    }
    
    async updateIncident(incidentId, updatedIncident) {
        try {
            const { isValid, errors } = this.validateIncidentData(updatedIncident);
    
            if (!isValid) {
                this.displayValidationErrors(errors);
                return;
            }
        
            updatedIncident.lastEditedBy = localStorage.getItem('username');
            const response = await axios.put(`/incidents/${incidentId}`, updatedIncident);
            if (response.status === 200) {
                const updatedIncidentData = response.data.incident;
                this.updateIncidentInList(incidentId, updatedIncidentData);
                this.showSuccessMessage('Incident updated');
                $('.mapboxgl-popup').remove();
            } else {
                console.error('Failed to update incident:', response.status);
            }
        } catch (error) {
            console.error('Error updating incident:', error);
        }
    }
    
    updateIncidentInList(incidentId, updatedIncidentData) {
        const incidentIndex = this.incidents.findIndex(incident => incident._id === incidentId);
        if (incidentIndex !== -1) {
            this.incidents[incidentIndex] = updatedIncidentData;
            this.incidents[incidentIndex].lastEditedBy.username = updatedIncidentData.lastEditedBy.username;
            const incident = this.incidents[incidentIndex];
            this.renderIncident(incident);
        }
    }
    
    closePopup(incident) {
        if (incident.marker && incident.marker.getPopup()) {
            incident.marker.getPopup().remove();
        }
    }
}

const incidentMap = new IncidentMap();