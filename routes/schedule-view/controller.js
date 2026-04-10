const {getScheduleById} = require("./services.js");

async function renderScheduleViewPage(req, res) {
  try {    
    const user = req.session.user;
    const scheduleId = req.params.id;
    const locale = req.language;
    const schedule = await getScheduleById(scheduleId);
    res.render("schedule-view", {
      activePage: "schedule",
      session: req.session,
      schedule,
      user,
      locale,
    });
  } catch (error) {
    console.error("Error rendering schedule view page: ", error);
    (res.status(500), send("Internal Server Erorr"));
  }
}

module.exports = {
    renderScheduleViewPage
}