const ERROR_MESSAGES = {
    UNKNOWN_USERNAME: "User not found",
    WRONG_PASSWORD: "Wrong password",
    NEED_AGREEMENT: "User has not agreed to terms",
    // Add more error types as needed
};

const invalidUsernameMessage = 'Username must be at least 3 characters long.';
const invalidPasswordMessage = 'Password must be at least 4 characters long.';
hasStarted = false;

const hasStartedTyping = (field) => {
    return field.length > 0;
}

const validateUsername = (username) => {
    return username.length >= 3;
}

const validatePassword = (password) => {
    return password.length >= 4;
}

// Event listener to validate on blur
const validateInput = (inputId, errorId, validationFunction, validationMessage) => {
    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);
    input.addEventListener('blur', () => {
        if (!validationFunction(input.value) && hasStarted) {
            error.style.display = 'block'; // Show error message
            error.textContent = validationMessage;
        } else {
            error.style.display = 'none'; // Hide error message
        }
    });

    input.addEventListener('input', () => {
        hasStarted = true;
        if (validationFunction(input.value)) {
            error.style.display = 'none';
        }
    });
}

validateInput('username', 'username-error', validateUsername, invalidUsernameMessage);
validateInput('password', 'password-error', validatePassword, invalidPasswordMessage);


function validateUsernameAndPassword(username,password) {
    let isValid = true;
    if (!validateUsername(username)) {
        document.getElementById('username-error').textContent = invalidUsernameMessage;
        document.getElementById('username-error').style.display = 'block';
        isValid = false; // Mark validation as failed
    } else {
        document.getElementById('username-error').style.display = 'none';
    }
    if (!validatePassword(password)) {
        document.getElementById('password-error').textContent = invalidPasswordMessage;
        document.getElementById('password-error').style.display = 'block';
        isValid = false; // Mark validation as failed
    } else {
        document.getElementById('password-error').style.display = 'none';
    }
    return isValid;
}

function addUserToSessionStorage(username, password) {
    const userData = {
        username: username,
        password: password
    };

    sessionStorage.setItem('tempUserData', JSON.stringify(userData));
    return userData;
}

function handleError(error) {
    const errorMessage = error.response.data.message;
    const errorStatus = error.response.status;
    console.log("Error status: " + errorStatus); // For debugging
    switch (errorMessage) {
        case ERROR_MESSAGES.UNKNOWN_USERNAME:
            console.error("User does not exist.");
            $('#confirmationModal').modal('show');
            break;
        case ERROR_MESSAGES.NEED_AGREEMENT:
            console.error("User has not agreed to terms.");
            $('#authSuccessModal').modal('show');
            break;
        case ERROR_MESSAGES.WRONG_PASSWORD:
        default:
            $('#errorModalMessage').text(errorMessage);
            $('#errorModal').modal('show');
            break;
    }
}

function handleSuccessfullLogin(response) {
    localStorage.setItem('username', response.data.user.username);
    localStorage.setItem('privilege', response.data.user.privilege);
    document.cookie = `token=${response.data.jwt}; skipAuth=true; path=/; secure; max-age=3600; samesite=strict;`;
    window.location.href = '/home?#esn-directory';
}

const authUser = async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const isValid = validateUsernameAndPassword(username, password);
    if (!isValid) {
        return;
    }
    const userData = addUserToSessionStorage(username, password);
    try {
        const response = await axios.put('/users/' + username + '/online', userData);
        handleSuccessfullLogin(response);
    } catch (error) {
        if (!error.response || !error.response.data) {
            return;
        }
        handleError(error);
    }
}

const confirmRegistration = async (userData) => {
    try {
        const response = await axios.post('/users', userData);
        $('#confirmationModal').modal('hide');
        $('#authForm').find('input[type=text], input[type=password]').val('');
        $('#authSuccessModal').modal('show');
    } catch (error) {
        console.log(error);
        alert("Registration failed: " + error.message);
        $('#confirmationModal').modal('hide');
    }
}

const AgreeComunityRules = async (userData) => {
    try {
        const response = await axios.put('/users/' + userData.username + '/agree', userData);
        $('#authSuccessModal').modal('hide');
        localStorage.setItem('username', response.data.user.username);
        localStorage.setItem('privilege', response.data.user.privilege);
        document.cookie = `token=${response.data.jwt}; skipAuth=true; path=/; secure; max-age=3600; samesite=strict;`;
        window.location.href = '/home?#esn-directory';
    } catch (error) {
        const errorMessage = error.response.data.message;
        $('#errorModalMessage').text(errorMessage);
        $('#errorModal').modal('show');
    }
}

$(document).ready(() => {
    $('#confirmationModalOkButton').click(() => {
        const userData = JSON.parse(sessionStorage.getItem('tempUserData'));
        confirmRegistration(userData);
        // sessionStorage.removeItem('tempUserData'); // Clean up
    });

    $('#authSuccessModalOkButton').click(() => {
        const userData = JSON.parse(sessionStorage.getItem('tempUserData'));
        AgreeComunityRules(userData);
        sessionStorage.removeItem('tempUserData');
    });
});