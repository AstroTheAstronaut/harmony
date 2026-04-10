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

async function makeSchedulesInactive() {
    try {
        const currentDate = new Date();
        const result = await Schedule.updateMany (
            {
                expiry_date : {$lte: currentDate},
                status: 'active'
            },
            {
                $set: {status: 'inactive'}
            }
        );
        return result;
    } catch (err) {
        console.error("Failed to make schedules inactive:", err);
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

async function createSchedule(scheduleData) {
    try {
        console.log("Schedule data: " + scheduleData);
        const newSchedule = new Schedule({
            name: scheduleData.name,
            description: scheduleData.description || '',
            bible_passage: scheduleData.bible_passage || '',
            schedule_uid: scheduleData.schedule_uid || uuidv4(),
            creator_uid: scheduleData.creator_uid,
            created_timestamp: scheduleData.created_timestamp || new Date(),
            type: scheduleData.type,
            target_church: scheduleData.target_church || '',
            expiry_date: scheduleData.expiry_date || null,
            status: scheduleData.scheduleStatus || 'pending',
            content: scheduleData.content || [], // Replaces song_list and speaker_list
            visibility: scheduleData.visibility || 'private'
        });
        
        await newSchedule.save();
        return Promise.resolve();
    } catch (err) {
        console.error('Error in createSchedule:', err);
        throw new Error('Failed to create schedule');
    }
}

module.exports = {
    getActiveSchedules,
    getInactiveSchedules,
    createSchedule,
    makeSchedulesInactive
}