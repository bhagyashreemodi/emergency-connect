import nodemailer from 'nodemailer';

// config of email sender
const user = "note-squared@outlook.com";
const pass = "note4001";

const transport = nodemailer.createTransport({
    service: "Outlook365",
    auth: {
        user: user,
        pass: pass,
    },
});

export const sendNotificationOnOfferHelp = (requesterEmail, requesterName, providerName, postTitle, message, providerEmail) => {
    transport.sendMail({
        from: `[FSE-SA4] Emergency Social Network <${user}>`,
        to: requesterEmail,
        subject: `[ESN] ${providerName} responds to your request!`,
        html: `<h1>Notification from ESN</h1>
        <h2>Hello, ${requesterName}!</h2>
        <p><b>${providerName}</b> just responded to your request: <b><i>${postTitle}</i></b></p>
        <br>
        <p><b>Message from ${providerName}:</b> ${message}</p>
        <br>
        <p><b>${providerName}'s Email:</b> ${providerEmail}</p>
        <br>
        <p>Login to ESN to check out: http://localhost:3000/home?#resource-sharing-hub</p>
        <br>
        <p>Kind regards,</p>
        <p>The ESN Team</p>
        `,
    }).catch(err => console.log(err));
}
