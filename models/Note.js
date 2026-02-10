const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    note: {
        type: String,
        required: true
    },
    note_author: {
        type: String,
        required: true
    }, 
    created_at : {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'notes'
});

module.exports = mongoose.models.Note || mongoose.model('Note', noteSchema);