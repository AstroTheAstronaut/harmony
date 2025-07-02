const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    notification_id : {
        type: String,
        required: true,
        unique: true
    },
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    type: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    seen: {
        type: Boolean,
        default: false
    },
    song_id : {
        type: String,
        ref: 'Song',
        required: false
    },
    link : {
        type: String,
        required: false
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'notifications'
});

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);