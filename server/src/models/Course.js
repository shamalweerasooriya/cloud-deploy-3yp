const { number } = require('@hapi/joi');
const mongoose = require('mongoose');   // imports mongoose
const Schema = mongoose.Schema;         // defines the strcuture of documents inside a collection

const courseSchema = new Schema({
    title : {
        type : String,
        required : true,
        max : 255,
        min : 8
    },
    description : {
        type : String,
        required : true,
        max : 4096,
        min : 3
    },
    level : {
        type : String,
        enum : ['Easy', 'Moderate', 'Hard'],
        required : true
    },
    category : {
        type : String,
        required : false
    },
    noOfStudents : {
        type : Number,
        required : true
    },
    searchTags : {
        type : [String],
        default : []
    },
    lessons : {
        type : [String],
        required : true
    },
    requirements : {
        type : [String],
        required : true
    },
    amount : {
        type : Number,
        default : 0
    },
    dateCreated : {
        type : Date,
        default : Date.now
    },
    isPublished : {
        type : Boolean,
        default : false
    },
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Tutor',
        required : true,
    },
    numberOfLessons : {
        type : Number,
        required : true,
        default : 0
    },
    pointsOfInterest : {
        type : Number,
        default : 0
    },
    rating : {
        type : Number,
        default : 0
    },
    estimatedDuration : {
        type : Number,
        default : 0
    },
    coverImage : {
        type : String,
        default : 'default:0'
    },
})

module.exports = mongoose.model('Course', courseSchema);