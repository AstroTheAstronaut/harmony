const e = require('express');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_uid : {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    fullname : {
        type: String  
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    last_connected: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: ['admin', 'user', 'mod', 'moderator', 'editor', 'viewer', 'superuser', 'ADMIN', 'MOD', 'MODERATOR', 'EDITOR', 'USER', 'VIEWER', 'SUPERUSER', 'Superuser'],
        default: 'user'
    },
    status : {
        type : String,
        enum: ['active', 'inactive', 'banned', 'suspended', 'deleted'],
        default: 'active',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    deleteDate : {
        type: Date,
        default: null
    },
    punishmentDate : {
        type: Date,
        default: null
    },
    punishmentReason : {
        type: String,
        default: null
    },
    punishmentDuration : {
        type: Number,
        default: null
    },
    previousOffences: {
        type: [{
            date: Date,
            reason: String,
            duration: {
                type: Number,
                default: null
            },
            actionType: String // e.g., 'ban', 'suspend', etc.
        }],
        default: []
    }
}, {
    collection: 'users',
    timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);