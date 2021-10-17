const express = require('express');
const { verify, verifyTutor } = require('./verifyToken');
const router = express.Router();
const Course = require('../models/Course');
const Tutor = require('../models/Tutor');
const { courseCreateValidation } = require('../validation/courseValidation');
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadPath)
    },
    filename: function(req, file, cb) {
      cb(null, `${file.fieldname}_dateVal_${Date.now()}_${file.originalname}`)
    }
});

const upload = multer({storage: storage});

router.post('/create', verifyTutor, async (req, res) => {
    console.log(req.body);
    // validate before saving the data
    const error = courseCreateValidation(req.body);
    if (error) return res.status(400).json({success: false, message: error.details[0].message});

    // authenticate the user
    const tutorExists = await Tutor.findOne({ _id: req.body.author });
    if (!tutorExists) return res.status(401).json({success: false, message: 'Unauthorized Access'});

    // create a new course
    const course = new Course({
        title: req.body.title,
        description: req.body.description,
        level: req.body.level,
        author: tutorExists,
        numberOfLessons: req.body.numberOfLessons,
        isPublished: req.body.isPublished,
        noOfStudents: req.body.noOfStudents,
        category: req.body.category,
        searchTags: req.body.searchTags,
        lessons: req.body.lessons,
        numberOfLessons: req.body.numberOfLessons,
        requirements: req.body.requirements,
        amount: req.body.amount
    });

    try {
        const id = await course.save();

        await Tutor.findByIdAndUpdate(req.body.author, { $push: { courses: id } });

        res.status(201).json({success: true, message: 'Course Created Successfully'});
    }
    catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
})

// get data of a specific course
router.get('/info/:id', verify, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).send({success: false, message: 'Course Not Found'});

        res.status(200).send({success: true, data: course});
    }
    catch (err) {
        res.status(400).send({success: false, message: err.message});
    }
})

// get all the data about courses.
// the data can be requested with pagination.
// example request: /course/all?page=1&limit=10&sort=latest.
router.get('/all', verify, async (req, res) => {
    try {
        const _count = req.query.count;

        const page = parseInt(req.query.page);
        const limit = parseInt(req.query.limit);
        let sortBy = { dateCreated: -1 };

        if (req.query.sort === 'trendy') sortBy = { pointsOfInterest: -1 };
        else if (req.query.sort == 'best-rated') sortBy = { rating: -1 };

        if (page < 1 || limit < 1) return res.status(400).send({success: false, message: 'Invalid Page or Limit'});
    
        // if page or limit is not provided, return all the data
        if (!page || !limit) {
            const courses = await Course.find({isPublished: true}).sort(sortBy);
            await Promise.all(courses.map(async course => {
                course.author = await Tutor.findById(course.author, '_id firstName lastName avatar courses');
                return course;
            }));
            return res.status(200).send({success: true, courses: courses});
        }
        // if page or limit is provided, return the data with pagination. alsp send the page number and limit of previous and next page.
        // example: {next: {page: 2, limit: 10}, previous: {page: 0, limit: 10}, courses: [{}, {}, {}]}
        else {
            const courses = await Course.find({isPublished: true}).skip((page - 1) * limit).limit(limit).sort(sortBy);
            await Promise.all(courses.map(async course => {
                course.author = await Tutor.findById(course.author, '_id firstName lastName avatar courses');
                return course;
            }));
            const count = await Course.countDocuments({isPublished: true});
            let next = {page: page + 1, limit: limit};
            let previous = {page: page - 1, limit: limit};
            if (courses.length < limit) next = null;
            else if (count - (page * limit) < limit) next.limit = count - (page * limit);
            if (page == 1 || (page - 1) * limit > count) previous = null;
            let result = {success: true, courses: courses, next: next, previous: previous};
            if (_count) result.count = count;
            res.status(200).send(result);
        }
    }
    catch (err) {
        res.status(400).send({success: false, message: err.message});
    }
})

module.exports = router;