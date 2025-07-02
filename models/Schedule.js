const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    schedule_uid: {
        type: String,
        required: true
    },
    created_timestamp: {
        type: Date,
        default: Date.now
    },
    schedule_items : {
        type: Array,
        default: []
    },
    created_by: {
        type: String,
        required: true
    },
    autodelete: {
        type: Boolean,
        default: false
    }
}, {
    collection: 'schedules'
});

module.exports = mongoose.models.Schedule || mongoose.model('Note', scheduleSchema);