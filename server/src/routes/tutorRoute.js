// imports dependencies
const express = require('express'); 
const router = express.Router();   
const User = require('../models/User');
const Tutor = require('../models/Tutor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyTutor } = require('./verifyToken');
const nodemailer = require('nodemailer');
const path = require('path');
const {resolve} = require('path');
const multer = require('multer');
fs = require('fs');

const uploadPath = resolve(__dirname, '../uploads/avatars');
const {registerValidation} = require('../validation/validation');

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
});

// registers a tutor
router.post('/register', async (req, res) => {
    // validate before saving data
    const error = registerValidation(req.body);
    if (error) return res.status(400).json({success: false, message: error.details[0].message});

    // checks if tutor is already in the database
    const usernameExist = await Tutor.findOne({username : req.body.username});
    if (usernameExist) return res.status(400).json({success: false, message: 'Username already exists'});

    const emailExist = await Tutor.findOne({email : req.body.email});
    if (emailExist) return res.status(400).json({success: false, message: 'Email already exists'});

    // hashes the password
    const salt = await bcrypt.genSalt(10);  
    const hashPW = await bcrypt.hash(req.body.password, salt);

    // creates a new tutor
    const tutor = new Tutor({
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        email : req.body.email,
        username : req.body.username,
        password : hashPW,
        DOB : req.body.DOB,
        phone : req.body.phone,
        country : req.body.country,
        deviceID : req.body.deviceID
    });

    // creates a new user
    const user = new User({
        username : req.body.username,
        email : req.body.email,
        role : 'tutor',
        ref : tutor // Reference to the tutor
    });

    try {
        await user.save();
        await tutor.save();

        // ***** email confirmation should be sent here *****
        const emailToken = await jwt.sign({_id : tutor._id}, process.env.TOKEN_SECRET, {expiresIn : '1d'});

        // html data
        const htmlPath = path.join(__dirname, process.env.EMAIL_PATH);

        var html1 = await fs.readFileSync(path.join(htmlPath, 'confirm-email-1.html').replace(/\\/g, '\\'));
        var html2 = await fs.readFileSync(path.join(htmlPath, 'confirm-email-2.html').replace(/\\/g, '\\'));
        var html3 = await fs.readFileSync(path.join(htmlPath, 'confirm-email-3.html').replace(/\\/g, '\\'));
        const url = `http://localhost:3000/register?role=tutor&token=${emailToken}&user=${tutor.username}`;
        transporter.sendMail({
            to : tutor.email,
            subject : "Confirm your Email",
            html : html1 + url + html2 + url + html3
        }, function(err, data) {
            if(err){
                console.log('Error: ', err);
            }
            else{
                console.log('Email sent');
            }
        });

        res.status(201).send({success: true, message: 'Tutor account created successfully'});
    }
    catch(err) {
        res.status(400).send({success: true, message: err.message});
    }
})

// gest basic info of the tutor
router.get('/info/:id/:filename?', verifyTutor, (req, res) => {
    const id = req.params.id;
    const filename = req.params.filename;
    Tutor.findById(id)
    .then(result => {
        if (filename) res.sendFile(path.join(uploadPath, result.avatar));
        else res.send({success: true, data: result, message: 'Tutor info retrieved successfully'});
    })
    .catch(err => {
        res.send({success: false, message: err.message});
    })
})

// upload profile avatar
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadPath)
    },
    filename: function(req, file, cb) {
      cb(null, `${file.fieldname}_dateVal_${Date.now()}_${file.originalname}`)
    }
});

const upload = multer({storage: storage});

router.post('/avatar/:id', upload.single('avatar-upload'), verifyTutor, async (req, res) => {
    try {
        const id = req.params.id;
        const file = req.file;
        const avatar = req.body.avatar;

        if (file) {
            await Tutor.findByIdAndUpdate(id, {
                $set : {
                    avatar : file.filename
                }
            });
        }
        else {
            await Tutor.findByIdAndUpdate(id, {
                $set : {
                    avatar : `default:${avatar}`
                }
            });
        }

        res.send({success: true, avatar: avatar, message: 'Avatar uploaded successfully'});
    }
    catch (e) {
        res.status(400).send({success: false, message: e.message});
    }
})

// email confirmation
router.get('/confirmation/:token', async(req, res) => {
    if(!req.params.token) return res.status(424).send({success: false, message: 'E-mail verification unsucessful'});
    try {
        const tutor =  jwt.verify(req.params.token, process.env.TOKEN_SECRET);
        const id = tutor._id;
        console.log(id);
        await Tutor.findByIdAndUpdate(id, {
            $set : {
                confirmed : "true"
            }
        })
    }
    catch (e) {
        res.send({success: false, message: 'E-mail verification unsucessful'});
    }
    res.status(201).send({success: true, message: 'E-mail verified'});
});

module.exports = router;