import App from './config/App.js';

const app = new App();
app.init().then(() => {
    console.log("--------------- Server Started ---------------");
});