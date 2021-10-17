// imports dependencies
const express = require('express');     
const mongoose = require('mongoose');   
const morgan = require('morgan');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require("path");
const app =  express();             

dotenv.config();    // configures dotenv

// imports routers
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const studentRoute = require('./routes/studentRoute');
const tutorRoute = require('./routes/tutorRoute');
const courseRoute = require('./routes/courseRoute');

// connects to the database
mongoose.connect(process.env.dbURI, { useNewUrlParser : true, useUnifiedTopology : true})
    .then((result) => {
        console.log('connected to data base');
        app.listen(process.env.API_PORT, () => {
            console.log("Server is up and running");
        })
    })
    .catch((err) => console.log(err));

// const corsOptions ={
//     origin:'http://localhost:3000', 
//     credentials:true,            //access-control-allow-credentials:true
//     optionSuccessStatus:200
// }

// middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname,"build")));
app.use('/auth', authRoute);
app.use('/user', userRoute);
app.use('/student', studentRoute);
app.use('/tutor', tutorRoute);
app.use('/course', courseRoute);
