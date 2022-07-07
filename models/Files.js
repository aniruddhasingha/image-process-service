const mongoose = require('mongoose');
const FilesSchema = mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalname: {
        type: String,
        required: true
    },
    extension:{
        type: String,
        required: true
    },
    path:{
        type: String,
        required: true
    },
    dimension:{
        width:{
            type: Number,
        required: true
        },
        height:{
            type: Number,
        required: true
        }
    }
}, { versionKey: false });
module.exports = mongoose.model('Files', FilesSchema);
