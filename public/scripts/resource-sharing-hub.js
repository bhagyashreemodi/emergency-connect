class ResourceSharingHub {

    constructor() {
        this.subtab = 'Community'; // 'Community' or 'Personal'
        this.postIdToEdit = null;
        this.postIdToOfferHelp = null;
    }

    async loadContents() {
        $('#postContainer').empty();
        const response = await axios.get(`/resource-requests`);
        const data = response.data || [];

        const username = localStorage.getItem('username');
        data.forEach(post => {
            if (this.subtab === 'Community' && post.username !== username) {
                this.displayPost(post, 'Community');
            }
            // if 'Personal' tab
            else if (this.subtab !== 'Community' && post.username === username) {
                this.displayPost(post, 'Personal');
            }
        });
    }

    displayPost(data, subtab) {
        const timestamp = data.timestamp ? Utils.formatTimestamp(data.timestamp) : '';
        const requestedItems = data.requestedItems ? data.requestedItems.join(', ') : '';
        const providers = data.providers ? data.providers.join(', ') : '';

        let buttons;
        if (subtab === 'Community') {
            buttons = `
            <div class="post-btn" style="justify-content: center;">
                <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#offerHelpModal" onclick="resourceSharingHub.offerHelpModalOpenModal('${data._id}')">Offer Help!</button>
            </div>`;
        } else {
            buttons = `
            <div class="post-btn" style="justify-content: space-between;">
                <button type="button" class="btn btn-primary" style="width: 36%;" data-toggle="modal" data-target="#editModal" onclick="resourceSharingHub.editPostModalOpenModal('${data._id}')">Edit</button>
                <button type="button" class="btn btn-danger" style="width: 36%;" onclick="ResourceSharingHub.onclickDeletePost('${data._id}')">Delete</button>
            </div>`;
        }

        const postElement = `
        <div class="chat-message">
            <div style="font-size: 125%"><b>${data.title || '# Help Wanted!'}</b></div>
            <div><b>Requested By:</b> ${data.username || ''}</div>
            <div><b>Time:</b> ${timestamp}</div>
            <div><b>Items Requested:</b> ${requestedItems}</div>
            <div><b>Description:</b> ${data.description || ''}</div>
            <div><b>Email:</b> ${data.email || ''}</div>
            <div><b>Address:</b> ${data.address || ''}</div>
            <div><b>Responded By:</b> ${providers}</div>
            ${buttons}
        </div>
        `;
        $('#postContainer').append(postElement);
    }

    async switchSubTabCommunity() {
        this.subtab = 'Community';
        await this.loadContents();
    }

    async switchSubTabPersonal() {
        this.subtab = 'Personal';
        await this.loadContents();
    }

    static editPostModalAddRequestedItem() {
        const container = document.getElementById('requestedItemsContainer');
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-control mb-2';
        input.name = 'requestedItem[]';
        container.appendChild(input);
        return input;
    }

    static editPostModalRemoveRequestedItem() {
        const container = document.getElementById('requestedItemsContainer');
        const inputs = container.getElementsByTagName('input');
        if (inputs.length > 1) {
            container.removeChild(inputs[inputs.length - 1]);
        }
    }

    static #editPostModalGetFormData() {
        const formData = {};

        // Get data from input fields
        formData.title = $('#editResourceRequestForm input[name="title"]').val();
        formData.description = $('#editResourceRequestForm textarea[name="description"]').val();
        formData.address = $('#editResourceRequestForm input[name="address"]').val();
        formData.email = $('#editResourceRequestForm input[name="email"]').val();

        // Get requested items
        const requestedItems = [];
        $('#editResourceRequestForm input[name="requestedItem[]"]').each(function() {
            const item = $(this).val();
            if (item) // remove empty items
                requestedItems.push(item);
        });
        formData.requestedItems = requestedItems;

        return formData;
    }

    async editPostModalSubmitForm() {
        // check form integrity
        const form = $('#editResourceRequestForm')[0];
        const isValid = form.checkValidity();
        if (!isValid) {
            console.log("[ResourceSharingHub] editPostModalSubmitForm: cannot submit form, since some required fields are not filled in");
            return;
        }

        // cannot get requestedItems correctly
        // const formData = new FormData(form);
        // const formDataJson = Object.fromEntries(formData);
        const formData = ResourceSharingHub.#editPostModalGetFormData();
        console.log(`[ResourceSharingHub] submit form: ${JSON.stringify(formData)}`);

        if (this.postIdToEdit) {
            // edit existing
            await axios.put(`/resource-requests/${this.postIdToEdit}`, {'formData': formData});
        } else {
            // create new
            await axios.post('/resource-requests', {'formData': formData});
        }

        ResourceSharingHub.editPostModalClearForm();
        $('#editModal').modal('hide');
    }

    async editPostModalOpenModal(postId = null) {
        this.postIdToEdit = postId;
        if (postId) {
            // edit existing post
            const response = await axios.get(`/resource-requests/${postId}`);
            ResourceSharingHub.editPostModalFillInForm(response.data);
        } else {
            // create a new post
            ResourceSharingHub.editPostModalClearForm();
        }
    }

    static async onclickDeletePost(postId) {
        await axios.delete(`/resource-requests/${postId}`);
    }

    static editPostModalFillInForm(data) {
        $('#editModal input[name="title"]').val(data.title || '');

        const requestedItemsContainer = $('#requestedItemsContainer');
        requestedItemsContainer.empty(); // Clear previous items
        data.requestedItems = data.requestedItems || [];
        if (data.requestedItems.length > 0) {
            data.requestedItems.forEach(item => {
                const element = ResourceSharingHub.editPostModalAddRequestedItem();
                element.value = item;
            });
        } else {
            // at least one input field
            ResourceSharingHub.editPostModalAddRequestedItem();
        }

        $('#editModal textarea[name="description"]').val(data.description || '');
        $('#editModal input[name="address"]').val(data.address || '');
        $('#editModal input[name="email"]').val(data.email || '');
    }

    static editPostModalClearForm() {
        ResourceSharingHub.editPostModalFillInForm({
            title: '',
            requestedItems: [],
            description: '',
            address: '',
            email: ''
        });
    }

    /* ------------------------------ offerHelpModal -------------------------------- */

    offerHelpModalOpenModal(postId) {
        if (!postId) {
            console.error("[ResourceSharingHub] offerHelpModalOpenModal: input postId invalid");
            return;
        }
        this.postIdToOfferHelp = postId;
    }

    async offerHelpModalSubmitForm() {
        if (!this.postIdToOfferHelp) {
            console.error("[ResourceSharingHub] this.postIdToOfferHelp not set when trying to submit offer help form");
            return;
        }

        // check form integrity
        const form = $('#offerHelpForm')[0];
        const isValid = form.checkValidity();
        if (!isValid) {
            console.log("[ResourceSharingHub] offerHelpModalSubmitForm: cannot submit form, since some required fields are not filled in");
            return;
        }

        // get form data
        const formData = Object.fromEntries(new FormData(form));
        console.log(`[ResourceSharingHub] submit form: ${JSON.stringify(formData)}`);
        await axios.put(`/resource-requests/${this.postIdToOfferHelp}/provider`, {'formData': formData});

        form.reset(); // clear form
        $('#offerHelpModal').modal('hide');
    }
}

const resourceSharingHub = new ResourceSharingHub();
