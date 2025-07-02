const { request } = require('express');
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    song_uid: {
        type: String,
        required: true,
    },
    request_id: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    expires_in: {
        type: Number, // TTL in seconds
        default: 14400 // Default to 1 day (86400 seconds)
    },
    requested_by: {
        type: String,
        required: true
    },
    expire_at: {
        type: Date, 
        default: function() {
            // Calculate expire_at dynamically when document is created
            return new Date(Date.now() + this.expires_in * 1000);
        }
    }
}, {
    collection: 'request'
});

// Ensure we have an index on expire_at for quick deletion of expired requests
requestSchema.index({ expire_at: 1 });

module.exports = mongoose.models.Request || mongoose.model('Request', requestSchema);
