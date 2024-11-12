const express=require("express");
const app=express();
const mongoose=require("mongoose");
const session=require("express-session");
const multer=require("multer");
const fs=require("fs");
const path=require("path")
const nodemailer=require("nodemailer")

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'whateverrbroochill@gmail.com',
        pass: 'azbskeczkkruabyt'
    }
});

const sendEmail = (to, subject, html) => {
    const mailOptions = {
        from: '"MedLink" <whateverrbroochill@gmail.com>',  // sender address
        to,  // receiver's email
        subject,  // email subject
        html,  // email body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error sending email: ", error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.use(session({
    secret:"abc",
    saveUninitialized:false,
    resave:true,
    cookie:{
        secure: false,
        maxAge: 1000 * 60 * 60 
    }
}))


app.set("view engine","ejs");


// Create upload directories if they don't exist
const testReportsDir = path.join(__dirname, 'upload', 'test_reports');
const doctorCredentialsDir = path.join(__dirname, 'upload', 'doctor_credentials');

if (!fs.existsSync(testReportsDir)) {
    fs.mkdirSync(testReportsDir, { recursive: true });
}
if (!fs.existsSync(doctorCredentialsDir)) {
    fs.mkdirSync(doctorCredentialsDir, { recursive: true });
}

// File filter function
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'test_reports' || file.fieldname === 'doctor_credentials') {
        cb(null, true);
    } else {
        cb(new Error('Invalid fieldname'), false);
    }
};

// Configure storage based on fieldname
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'test_reports') {
            cb(null, testReportsDir);
        } else if (file.fieldname === 'doctor_credentials') {
            cb(null, doctorCredentialsDir);
        }
    },
    filename: function (req, file, cb) {
        cb(null,file.originalname);
    }
});

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});
module.exports = {upload,sendEmail}; // Export the upload instance

mongoose.connect("mongodb://localhost:27017/doctor-patient-portal",{
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(()=>{
    console.log("Successfully connected to the MongoDB database.");
}).catch((error)=>{
    console.error("Error connecting to the database:",error);
});

// Import Schemas
require("./models/adminSchema");
require("./models/doctorSchema");
require("./models/patientSchema");
require("./models/appointmentSchema");

// Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");

// Use Routes
app.use("/", authRoutes);
app.use("/", adminRoutes);
app.use("/", doctorRoutes);
app.use("/", patientRoutes);
app.use("/", appointmentRoutes);
app.use("/", emergencyRoutes);


app.listen(3000,(e)=>{
    if(e){
        console.log(e);
    }
    else{
        console.log("Server started on port 3000");
    }
})