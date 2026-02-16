const {getScheduleById} = require("./services");


async function renderScheduleViewPage(req, res) {
  try {    
    const user = req.session.user;
    const locale = req.language;
    res.render("schedule-view", {
      activePage: "schedule",
      session: req.session,
      user,
      locale,
    });
  } catch (error) {
    console.error("Error rendering schedule view page: ", error);
    (res.status(500), send("Internal Server Erorr"));
  }
}

async function renderWithScheduleId(req, res) {
  try {
    const scheduleId = req.params.id;
    const schedule = await getScheduleById(scheduleId);
    const user = req.session.user;
    const locale = req.language;
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
  renderScheduleViewPage,
  renderWithScheduleId
};
