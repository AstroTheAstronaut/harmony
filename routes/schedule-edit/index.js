const express = require("express");
const router = express.Router();
const controller = require("./controller");

router.get("/", controller.renderScheduleViewPage);

router.get("/:id", controller.renderWithScheduleId);
router.post("/:id/add-content", controller.pushContentToSchedule);
router.post("/:id/delete-content", controller.removeContent);
router.post("/:id/reorder", controller.reorderContent);
router.post("/:id/edit-details", controller.editScheduleDetails);

module.exports = router;
