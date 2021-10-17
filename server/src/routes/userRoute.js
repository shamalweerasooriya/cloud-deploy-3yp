const express = require('express');
const router = express.Router();   
const { verify } = require('./verifyToken');
const User = require('../models/User');
const Tutor = require('../models/Tutor');
const Student = require('../models/Student');

router.get('/:username', verify, async (req, res) => {
    const user = await User.findOne({username: req.params.username});
    if(!user) return res.status(404).send({success: false, message: 'User not found'});
    
    if(user.role === 'tutor'){
        const tutor = await Tutor.findOne({user: user._id});
        return res.send({success: true, data: tutor});
    }
    else if(user.role === 'student'){
        const student = await Student.findOne({user: user._id});
        return res.send({success: true, data: student});
    }
    else return res.status(404).send({success: false, message: 'User not found'});
});

module.exports = router;