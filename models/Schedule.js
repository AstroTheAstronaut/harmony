const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: '',
        required: false
    },
    bible_passage: {
        type: String,
        default: '',
        required: false
    },
    schedule_uid: {
        type: String,
        required: true
    },
    creator_uid: {
        type: String,
        required: true
    },
    created_timestamp: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        required: true
    },
    target_church: {
        type: String,
        default: '',
        require:false
    }, 
    expiry_date: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        default: 'active',
        required:true
    },
    content: {
        type: Array,
        default: []
    },
    visibility: {
        type: String,
        default: 'private',
        required: true,
        enum: ['private', 'public']
    }
}, {
    collection: 'schedules'
});

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);