const {getActiveSchedules, getInactiveSchedules, createSchedule, makeSchedulesInactive} = require('../schedules/services');
const { v4: uuidv4 } = require('uuid');

async function renderSchedulesPage (req, res) {
    try {
        await makeSchedulesInactive();
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
        const { name, description, bible_passage, type, target_church,  expiry_date, scheduleStatus, visibility } = req.body;
        const creator_uid =  req.body.creator_uid;
        const schedule_uid = uuidv4();
        const payloadData = {
            name: name,
            description: description,
            bible_passage: bible_passage,
            type: type,
            target_church: target_church,
            expiry_date: expiry_date,
            status: scheduleStatus,
            schedule_uid: schedule_uid,
            visibility: visibility,
            creator_uid: creator_uid,
        }
        console.log("Sending payload: " + payloadData);
        await createSchedule(payloadData);
        
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