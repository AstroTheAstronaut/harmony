const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['song_request', 'user_login', 'user_activity', 'system_event'],
        required: true
    },
    user: {
        type: String,
        required: true
    },
    songTitle: String,
    bookTitle: String,
    ipAddress: String,
    activity: String,
    event: String,
    description: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'logs'
});

module.exports = mongoose.models.Log || mongoose.model('Log', logSchema);