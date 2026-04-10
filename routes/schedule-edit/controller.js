const {getScheduleById, addContentToSchedule, removeContentFromSchedule, reorderContentFromSchedule} = require("./services");
const { getSongById } = require('../../functions/songs');


async function renderScheduleViewPage(req, res) {
  try {    
    const user = req.session.user;
    const locale = req.language;
    res.render("schedule-edit", {
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
    res.render("schedule-edit", {
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

async function pushContentToSchedule(req, res) {
  try {
    const scheduleId = req.params.id;
    const { type, title, song_uid, speaker, verses, singers } = req.body;
    let content = null;
    switch (type) {
      case 'song':
        content = {
          type: type,
          title: title,
          song_uid: song_uid
        };
        break;
      case 'intro' :
        content = {
          type: type,
          speaker: speaker
        };
        break;
      case 'verses': 
        content = {
          type: type,
          speaker: speaker,
          verses: verses || null
        };
        break;
      case 'poem':
        content = {
          type: type,
          speaker: speaker
        };
        break;
      case 'solo_song':
        content = {
          type: type,
          title: title || null,
          singers: Array.isArray(singers) ? singers : [singers]
        };
        break;
      default:
        return res.status(400).json({ error: "DEBUG: Unknown content type /routes/schedule-view/controller.js" });
    }
    if (content) {
      await addContentToSchedule(scheduleId, content);
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.status(200).json({ success: true });
      }
      return res.redirect(req.get("Referrer") || "/");
    } else {
      res.status(400).send("Invalid content type");
    }
  } catch (error) {
    console.error("Cannot push content to schedule: ", error);
  }
}

async function addSongToSchedule(req, res) {
  try {
    const scheduleId = req.params.id;
    const { song_uid } = req.body;

    if (!song_uid) {
      return res.status(400).send('Song UID is required');
    }

    const schedule = await getScheduleById(scheduleId);
    const song = await getSongById(song_uid);

    if (!song) {
      return res.status(404).send('Song not found');
    }

    const currentContent = (schedule.content || []).filter(item => item && typeof item === 'object' && item.type);
    const nextPosition = currentContent.reduce((max, item) => {
      const itemPosition = Number(item.position) || 0;
      return itemPosition > max ? itemPosition : max;
    }, 0) + 1;

    await addContentToSchedule(scheduleId, {
      type: 'song',
      title: song.title,
      song_uid: song.song_uid,
      position: nextPosition,
    });

    return res.redirect(`/schedule-edit/${scheduleId}`);
  } catch (error) {
    console.error('Error adding song to schedule:', error);
    return res.status(500).send('Internal Server Error');
  }
}

async function removeContent(req, res) {
    try {
        const scheduleId = req.params.id;
        const { position } = req.body; 
        console.log("Deleting content from position: ", position)
        await removeContentFromSchedule(scheduleId, position);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(200).json({ success: true });
        }
        
        // Fallback for standard form users
        return res.redirect(req.get("Referrer") || "/");
        
    } catch (error) {
        console.error("Cannot delete content: ", error);
        res.status(500).send("Failed to delete item");
    }
}

async function reorderContent (req, res) {
  try {
    const scheduleId = req.params.id;
    const { newOrder } = req.body;
    
    await reorderContentFromSchedule(scheduleId, newOrder);

    return res.redirect(req.get("Referrer") || "/");

  } catch (error) {
        console.error("Reorder failed:", error);
        res.status(500).json({ error: "Server error during reorder" });
    }
}

async function editScheduleDetails (req, res) {
  try {
    const scheduleId = req.params.id;
    const { name, description, type, target_church, bible_passage, expiry_date, visibility } = req.body;
    let payload;
    payload = {
      name,
      description,
      type,
      target_church,
      bible_passage,
      expiry_date: expiry_date ? new Date(expiry_date) : null,
      visibility
    }
    console.log ("Changing: ", payload);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to edit schedule details:", error);
    res.status(500).json({ error: "Server error during details editing" });
  }
}

module.exports = {
  renderScheduleViewPage,
  renderWithScheduleId,
  addSongToSchedule,
  pushContentToSchedule,
  removeContent,
  reorderContent,
  editScheduleDetails
};
