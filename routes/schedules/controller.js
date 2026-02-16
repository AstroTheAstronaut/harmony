const {getActiveSchedules, getInactiveSchedules, createSchedule} = require('../schedules/services');
const { v4: uuidv4 } = require('uuid');

async function renderSchedulesPage (req, res) {
    try {
        const activeSchedules = await getActiveSchedules();
        const inactiveSchedules = await getInactiveSchedules();
        const user = req.session.user;
        const locale = req.language;
        res.render('schedules', {activePage: 'schedule', session: req.session, activeSchedules, inactiveSchedules, user, locale});
    } catch (error) {
        console.error('Error rendering schedules page:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function createScheduleRoute (req, res) {
    try {
        const { name, description, biblebible_passage, type, target_church,  expiry_date, scheduleStatus, visibility } = req.body;
        const creator_uid =  req.body.creator_uid;
        console.log(req.body);
        const schedule_uid = uuidv4();
        await createSchedule(name, description, bible_passage, schedule_uid, creator_uid, new Date(), type, target_church, expiry_date, scheduleStatus, [], [], visibility);
        res.status(200).send('Schedule created successfully');
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    renderSchedulesPage,
    createScheduleRoute
};