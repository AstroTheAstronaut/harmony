const {getActiveSchedules, getInactiveSchedules, createSchedule} = require('../schedules/services');
const { v4: uuidv4 } = require('uuid');

async function renderSchedulesPage (req, res) {
    try {
        const activeSchedules = await getActiveSchedules();
        const inactiveSchedules = await getInactiveSchedules();
        res.render('schedules', {activePage: 'schedule', session: req.session, activeSchedules, inactiveSchedules});
    } catch (error) {
        console.error('Error rendering schedules page:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function createScheduleRoute (req, res) {
    try {
        const { type, target_church,  expiry_date, scheduleStatus } = req.body;
        const creator_uid =  req.body.creator_uid;
        const schedule_uid = uuidv4();
        //Debug payload to show in console
        console.log('Creating schedule with payload:', {
            schedule_uid,
            creator_uid,
            type,
            target_church,
            expiry_date,
            scheduleStatus
            }); 
        await createSchedule(schedule_uid, creator_uid, new Date(), type, target_church, expiry_date, scheduleStatus, [], []);
        res.status(200).send('Schedule created successfully');
        res.redirect(sender);
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderSchedulesPage,
    createScheduleRoute
};