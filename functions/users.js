const User = require('../models/User');

async function getUsers() {
    try {
        var users = await User.find({}, { password: 0, __v: 0 });
        return users;
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getUser(role, password) {
    try {
        var user = await User.findOne({ role: (role+'').toLowerCase(), password: password });
    
        if(!user) return [];
        return [{
            id: user.id,
            role: user.role,
            last_connected: user.last_connected
        }];
    } catch (err) {
        return Promise.reject(err);
    }
}

async function getUserWithoutPassword(role) {
    try {
        var user = await User.findOne({ role: (role+'').toLowerCase() });
    
        if(!user) return [];
        return [{
            id: user.id,
            role: user.role,
            last_connected: user.last_connected
        }];
    } catch (err) {
        return Promise.reject(err);
    }
}

async function deleteUsers() {
    try {
        const currentDate = new Date();

        const usersToDelete = await User.find({
            deleteDate: { $lte: currentDate },
            status: 'deleted'
        });

        if (usersToDelete.length === 0) {
            return Promise.resolve('No users to delete');
        }

        const userUids = usersToDelete.map(user => user.user_uid);
        await User.deleteMany({ user_uid: { $in: userUids } });

        return Promise.resolve(`Deleted ${usersToDelete.length} users`);
    } catch (err) {
        return Promise.reject(err);
    }
}

async function updateUserStatus(userId, newStatus, reason = null, durationDays = null) {
    try {
        const user = await User.findOne({ user_uid: userId });
        if (!user) throw new Error(`User not found: ${userId}`);

        // Save old status and punishment info in case needed for previousOffences
        const oldStatus = user.status;
        const oldPunishmentReason = user.punishmentReason;
        const oldPunishmentDuration = user.punishmentDuration;
        const oldPunishmentDate = user.punishmentDate;

        // Clear punishment info by default
        user.punishmentReason = null;
        user.punishmentDuration = null;
        user.punishmentDate = null;
        user.deleteDate = null;

        if (newStatus === 'deleted') {
            user.status = 'deleted';
            user.deleteDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            user.punishmentReason = reason || 'No reason provided';
            user.punishmentDate = new Date();

            // Add to previousOffences
            user.previousOffences.push({
                date: user.punishmentDate,
                reason: user.punishmentReason,
                duration: durationDays || 7, // default 7 days until deletion
                type: 'delete',
            });
        } 
        else if (newStatus === 'suspended' || newStatus === 'banned') {
            user.status = newStatus;
            user.punishmentReason = reason || 'No reason provided';
            user.punishmentDuration = durationDays || null;
            user.punishmentDate = new Date();

            user.previousOffences.push({
                date: user.punishmentDate,
                reason: user.punishmentReason,
                duration: durationDays || null,
                type: newStatus,
            });
        }
        else if (newStatus === 'undelete') {
            user.status = 'active';
            user.deleteDate = null;
        } 
        else if (newStatus === 'unsuspend' || newStatus === 'unban') {
            user.status = 'active';
        } else {
            // For other statuses, just update status
            user.status = newStatus;
        }

        await user.save();
    } catch (err) {
        throw err;
    }
}

module.exports = { 
    getUsers,
    getUser,
    getUserWithoutPassword,
    deleteUsers,
    updateUserStatus
}