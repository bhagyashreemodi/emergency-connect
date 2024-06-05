import fetch from 'node-fetch';


export default class SMSSubscriber {

    static sendSMSNotification(firstName, phoneNumber, task) {
        try {
            let to = this.formatPhoneNumber(phoneNumber);
            fetch('https://textbelt.com/text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: to,
                    message: `Hello, ${firstName} need your help with ${task.skill} at ${task.fullAddress}. Please accept the task on dashboard if you are available to help.`,
                    key: process.env.TEXT_BELT_API_KEY, // This is for the free tier, which has limitations.
                }),
            }).then(r => console.log(`SMS sent to ${to}`)).catch(e => console.error(e));

        } catch (error) {
            console.error(`error sending SMS to ${phoneNumber}`);
        }
    }

    static formatPhoneNumber(number) {
        // Remove hyphens, add country code +1 for US numbers
        return number.replace(/-/g, '');
    }
}