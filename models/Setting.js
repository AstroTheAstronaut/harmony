const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    type: {
        type: String,
        enum: ['string', 'number', 'boolean', 'object', 'array'],
        required: true
    },
    category: {
        type: String,
        required: true,
        default: 'general'
    },
    description: {
        type: String,
        required: false
    },
    isEditable: {
        type: Boolean,
        default: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Index for faster queries
settingSchema.index({ key: 1 });
settingSchema.index({ category: 1 });

module.exports = mongoose.model('Setting', settingSchema);
