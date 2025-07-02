const {User} = require('../../models/User');

async function getUserByUsername (username) {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error(`User ${username} not found`);
        }
        return user;
    } catch (err) {
        console.error('Error fetching user by username:', err);
        throw new Error('Internal Server Error');
    }
}

module.exports = {
    getUserByUsername
}