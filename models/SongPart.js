const mongoose = require('mongoose');

const songPartSchema = new mongoose.Schema({
    song_uid: {
        type: String,
        required: true,
    },
    part_type: {
        type: String,
        required: true
    },
    lyrics: {
        type: String,
        index: true,
        required: true
    },
    part_order: {
        type: Number,
        required: true
    }
}, {
    collection: 'songParts'
});
songPartSchema.index({lyrics: 'text'});

module.exports = mongoose.models.SongPart || mongoose.model('SongPart', songPartSchema);