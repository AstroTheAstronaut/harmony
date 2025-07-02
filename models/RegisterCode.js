const mongoose = require('mongoose');

const registerCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        default: 'user',
        required: true
    },
    isUsed: {
        type: Boolean,
        default: false,
        required: true
    },
    isExpired: {
        type: Boolean,
        default: false,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true,
    }
}, {
    collection: 'registerCodes',
    timestamps: true
});

module.exports = mongoose.models.RegisterCode || mongoose.model('RegisterCode', registerCodeSchema);