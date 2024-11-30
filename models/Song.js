const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: {
        type: String,
        unique: true,
        required: true
    },
    artist: {
        type: String,
        required: true
    },
    book_uuid: {
        type: String,
        ref: 'Book'
    },
    book_song_number: {
        type: Number,
        required: true
    },
    song_uid: {
        type: String,
        required: true
    },
    chord: {
        type:String
    },
    request_count: {
        type: Number,
        default: 0
    }
}, {
    collection: 'songs'
});

module.exports = mongoose.models.Song || mongoose.model('Song', songSchema);