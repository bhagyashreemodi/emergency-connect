export default class DAO {
    static #configured = false;
    static _db; // this must implement all IDatabase operations

    static get db() {
        if (DAO.#configured) return DAO._db;
        throw new Error("DB not configured!");
    }

    static set db(db) {
        if (DAO.#configured) throw new Error("DB already configured!");
        DAO._db = db;
        DAO.#configured = true;
    }
}