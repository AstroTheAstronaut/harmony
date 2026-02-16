const Schedule = require('../../models/Schedule');

async function getScheduleById(scheduleId) {
    try {
        const schedule = await Schedule.findOne({ schedule_uid: scheduleId });
        if (!schedule) {
            throw new Error('Schedule not found');
        }
        return schedule;
    } catch (err) {
        console.error('Error in getScheduleById:', err);
        throw new Error('Failed to retrieve schedule by ID');
    }
}

async function addContentToSchedule(scheduleId, content_type, content) {
    try {
        const schedule = await Schedule.findOne({ schedule_uid: scheduleId });
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        schedule.content.push({ content_type, content });
        await schedule.save();
        return schedule;
    } catch (err) {
        console.error('Error in addContentToSchedule:', err);
        throw new Error('Failed to add content to schedule');
    }
}

module.exports = {
    getScheduleById,
    addContentToSchedule,
};