const Schedule = require("../../models/Schedule")

async function getScheduleById(scheduleId) {
    try {
        const schedule = await Schedule.findOne({ schedule_uid: scheduleId });
        if (!schedule) {
            throw new Error('Schedule not found');
        }

        const originalLength = Array.isArray(schedule.content) ? schedule.content.length : 0;
        schedule.content = (schedule.content || []).filter(item => item && typeof item === 'object' && item.type);

        if (schedule.content.length !== originalLength) {
            await schedule.save();
        }

        return schedule;
    } catch (err) {
        console.error('Error in getScheduleById:', err);
        throw new Error('Failed to retrieve schedule by ID');
    }
}

module.exports = {
    getScheduleById
}