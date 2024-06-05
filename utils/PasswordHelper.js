import bcrypt from 'bcrypt';

export default class PasswordHelper {
    static async encryptPassword(originalPwd) {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(originalPwd, salt);
    }

    static async comparePassword(rawPwd, hashedPwd) {
        return await bcrypt.compare(rawPwd, hashedPwd);
    }
}
