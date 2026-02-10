const Schedule = require('../../models/Schedule');
const User = require('../../models/User');
const { v4: uuidv4 } = require('uuid');

async function getActiveSchedules () {
    try {
        const currentDate = new Date();
        const schedules = await Schedule.find({
            $or: [
                { expiry_date: { $gt: currentDate } },
                { expiry_date: { $exists: false } },
                { expiry_date: null }
            ],
            status: { $in: ['active', 'pending'] }
        }).sort({ created_timestamp: -1 });
        return schedules;
    } catch (err) {
        console.error('Error in getActiveSchedules:', err);
        throw new Error('Failed to retrieve active schedules');
    }
}

async function getInactiveSchedules () {
    try {
        const currentDate = new Date();
        const schedules = await Schedule.find({
            expiry_date: { $lte: currentDate },
            status: { $in: ['inactive', 'expired'] }
        }).sort({ created_timestamp: -1 });
        return schedules;
    } catch (err) {
        console.error('Error in getInactiveSchedules:', err);
        throw new Error('Failed to retrieve inactive schedules');
    }
}

async function createSchedule(schedule_uid, creator_uid, created_timestamp, type, target_church, expiry_date, scheduleStatus, song_list, speaker_list) {
    try {
        const newSchedule = new Schedule({
            schedule_uid: schedule_uid || uuidv4(),
            creator_uid: creator_uid,
            created_timestamp: created_timestamp || new Date(),
            type: type,
            target_church: target_church || '',
            expiry_date: expiry_date || null,
            status: scheduleStatus || 'pending',
            song_list: song_list || [],
            speaker_list: speaker_list || []
        });
        await newSchedule.save();
        return Promise.resolve();
    } catch (err) {
        console.error('Error in createSchedule:', err);
        throw new Error('Faile  d to create schedule');
    }
}

module.exports = {
    getActiveSchedules,
    getInactiveSchedules,
    createSchedule
}