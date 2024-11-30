const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    bo_uid: {
        type: String,
        unique: true,
        required: true,
    },
    bo_name:{
        type: String,
        required: true
    }
}, {
    collection: 'books'
});

module.exports = mongoose.models.Book || mongoose.model('Book', bookSchema);