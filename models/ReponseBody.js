export default class ResponseBody {

    constructor() {
        this.status = '';
        this.message = '';
        this.success = false;
        this.jwt = '';
        this.user = null;
    }


    getStatus() {
        return this.status;
    }

    setStatus(value) {
        this.status = value;
    }

    getMessage() {
        return this.message;
    }

    setMessage(value) {
        this.message = value;
    }

    getSuccess() {
        return this.success;
    }

    setSuccess(value) {
        this.success = value;
    }

    getJwt() {
        return this.jwt;
    }

    setJwt(value) {
        this.jwt = value;
    }

    getUser() {
        return this.user;
    }

    setUser(value) {
        this.user = value;
    }

    buildUserCreatedResponse(user, token) {
        this.setSuccess(true);
        this.setMessage('New user created successfully');
        this.setJwt(token);
        this.setUser(user)
        return this;
    }

    buildLoginSuccessResponse(user, token) {
        this.setSuccess(true);
        this.setMessage('Login successful');
        this.setJwt(token);
        this.setUser(user);
        return this;
    }

    buildGetUserResponse(user) {
        this.setSuccess(true);
        this.setMessage('Get user successful');
        this.setJwt('');
        this.setUser(user);
        return this;
    }
}