export default class DateTimeUtil {
    static getStartOfDayToday() {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        return date;
    }

    static getStartOfDayTomorrow() {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
        return date;
    }
}