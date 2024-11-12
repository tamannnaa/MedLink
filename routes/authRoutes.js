const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorSchema");
const Patient = require("../models/patientSchema");
const Admin = require("../models/adminSchema");
const multer = require("multer");

const {upload,sendEmail} = require("../server2.js");

const generateUniqueId = async () => {
    let id;
    do {
        id = Math.floor(100000000 + Math.random() * 900000000).toString(); // Generates a 9-digit ID
    } while (await Patient.exists({ mpd: id })); // Check if the ID already exists
    return id;
};


const verificationEmailTemplate = (code) => `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="background-color: #354f36; padding: 10px;">
            <h1 style="color: white; text-align: center;">MedLink</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #4CAF50;">
            <h2 style="color: #4CAF50;">Email Verification</h2>
            <p>Thank you for logging into your account. Please use the code below to verify your email address:</p>
            <div style="font-size: 24px; font-weight: bold; color: #333; margin: 20px 0;">
                ${code}
            </div>
            <p>If you did not request this verification code, please ignore this email.</p>
            <p style="margin-top: 20px;">Best Regards, <br><strong>MedLink Support Team</strong></p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center;">
            <p style="font-size: 12px; color: #777;">&copy; 2024 MedLink, All rights reserved.</p>
        </div>
    </div>
`;


// Home Route with redirection if authenticated
router.get("/", (req, res) => {
    if (req.session.isAuthenticated) {
        switch (req.session.role) {
            case "doctor":
                return res.redirect("/doctordashboard");
            case "patient":
                return res.redirect("/patientdashboard");
            case "admin":
                return res.redirect("/admindashboard");
            default:
                return res.redirect("/"); // Redirect to home if role is unrecognized
        }
    }
    res.render("home"); // Render home page if not authenticated
});

// Doctor Registration
router.get("/doctorsign",(req,res)=>{
    res.render("doctorsign",{message:null});
})

router.post("/doctorsign",upload.single("doctor_credentials"),async(req,res)=>{
    let {name,email,phone,password,specialization}=req.body;
    const document=req.file?{
        fileName:req.file.filename,
        fileUrl: `/upload/doctor_credentials/${req.file.filename}`
    }:null;

    const existingdoctor= await Doctor.findOne({email})
    if(existingdoctor){
        res.render("doctorlogin",{message:"You are already registered, Please login!"})
    }
    else{
        const doctor=new Doctor({
            name,
            email,
            phone,
            password,
            specialization,
            documents:document?[document]:[],
            status:"pending",
        })
        try{
            await doctor.save();
            res.redirect("/doctorlogin");
        }
        catch(error){
            console.error(error);
            res.status(500).render({message:"Error saving doctor data. Please try again."});
        }
    }

})

// Patient Registration
router.get("/patientsign",(req,res)=>{
    res.render("patientsign",{message:null});
})

router.post("/patientsign",async(req,res)=>{
    let {name,email,phone,password}=req.body;
    const existingpatient=await Patient.findOne({email});

    if(existingpatient){
        res.render("patientlogin",{ message:"You are already registered, Please login!"});
    }
    else{
        const mpd = await generateUniqueId(); 
        const patient=new Patient({
            name,
            email,
            phone,
            password,
            status:'pending',
            mpd
        });
        try{
            await patient.save();
            res.redirect("/patientlogin");
        } 
        catch(error){
            console.error(error);
            res.status(500).send("Error saving patient data. Please try again.");
        }
    }
})

// Doctor Login
router.get("/doctorlogin",(req,res)=>{
    res.render("doctorlogin",{message:null});
})

router.post("/doctorlogin",async(req,res)=>{
    let {email,password}=req.body;
    const user= await Doctor.findOne({email});
    if(user){
        if(user.password==password){
            if(user.status==="pending"){
                // If the doctor status is pending, show a message
                res.render("pendingapproval",{ message:"You are not approved yet. Please wait for your approval." });
            } 
            else if (user.status === "rejected") {
                // Find the doctor to retrieve their name and pass it to the view
                const doctorDetails = await Doctor.findById(user._id); // Assuming `user._id` is the doctor ID
                res.render("reject", { doctor: doctorDetails });
            }
            else {
                // Generate verification code and store it in session
                const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
                req.session.verificationCode = verificationCode;
                req.session.tempUserId = user._id;  // Temporarily store user ID for 2FA

                // Send verification code via email
                sendEmail(user.email, "MedLink | Verify Email via Two Factor Authentication",verificationEmailTemplate(verificationCode));

                // Redirect to verification page
                res.render("verifyCode", { message: "Enter the code sent to your email." });
            }
        }
        else{
            res.render("doctorlogin",{message:"Incorrect password. Please try again." });
        }
    }
    else{
        res.render("doctorsign",{message:"You are not registered, Please register!"})
    }
})

// Verification Route
router.post("/verifyCode", async (req, res) => {
    const { code } = req.body;

    console.log("Session Code:", req.session.verificationCode);
    console.log("Submitted Code:", code);
    
    // Check if code matches
    if (req.session.verificationCode === code) {
        // Retrieve the user from the database using tempUserId
        const user = await Doctor.findById(req.session.tempUserId);

        if (user) {
            req.session.userId = user._id;
            req.session.role = "doctor";
            req.session.isAuthenticated = true;
            req.user = user;

            // Clear temporary data
            delete req.session.verificationCode;
            delete req.session.tempUserId;

            console.log("Redirecting to doctor dashboard...");
            res.redirect("/doctordashboard");
        } else {
            console.log("User not found in the database.");
            res.render("doctorlogin", { message: "User not found. Please log in again." });
        }
    } else {
        console.log("Verification code does not match.");
        res.render("verifyCode", { message: "Incorrect code. Please try again." });
    }
});


// Patient Login
router.get("/patientlogin",(req,res)=>{
    res.render("patientlogin",{message:null});
})

router.post("/patientlogin", async (req, res) => {
    let { email, password } = req.body;
    const user = await Patient.findOne({ email });

    if (user) {
        if (user.password === password) {
            // Generate verification code and store it in session
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
            req.session.verificationCode = verificationCode;
            req.session.tempUserId = user._id;  // Temporarily store user ID for 2FA

            // Send verification code via email
            sendEmail(user.email,"MedLink | Verify Email via Two Factor Authentication", verificationEmailTemplate(verificationCode));

            // Redirect to verification page
            res.render("verifyPatientCode", { message: "Enter the code sent to your email." });
        } else {
            res.render("patientlogin", { message: "Incorrect password. Please try again." });
        }
    } else {
        res.render("patientsign", { message: "You are not registered, Please register!" });
    }
});

// Patient Verification Route
router.post("/verifyPatientCode", async (req, res) => {
    const { code } = req.body;

    console.log("Session Code:", req.session.verificationCode);
    console.log("Submitted Code:", code);

    // Check if code matches
    if (req.session.verificationCode === code) {
        // Retrieve the user from the database using tempUserId
        const user = await Patient.findById(req.session.tempUserId);

        if (user) {
            req.session.userId = user._id;
            req.session.role = "patient";
            req.session.isAuthenticated = true;
            req.user = user;

            // Clear temporary data
            delete req.session.verificationCode;
            delete req.session.tempUserId;

            console.log("Redirecting to patient dashboard...");
            res.redirect("/patientdashboard");
        } else {
            console.log("User not found in the database.");
            res.render("patientlogin", { message: "User not found. Please log in again." });
        }
    } else {
        console.log("Verification code does not match.");
        res.render("verifyPatientCode", { message: "Incorrect code. Please try again." });
    }
});

// Admin Login
router.get("/adminlogin",(req,res)=>{
    res.render("adminlogin",{message:null});
})

router.post("/adminlogin",async (req,res)=>{
    let {username,password}=req.body;
    const user=await Admin.findOne({username});

    if(user){
        if(user.password==password){
            req.session.userId=user._id;
            req.session.role="admin";
            req.session.isAuthenticated=true;
            res.redirect("/admindashboard"); 
        }
        else {
            res.render("adminlogin",{ message:"Incorrect password. Please try again."});
        }
    }
    else{
        res.render("adminlogin",{message: "Admin not found. Please check your username."});
    }
})


// Logout Route
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.redirect("/"); // Redirect to home even if there's an error
        }
        res.redirect("/"); // Redirect to home page after logout
    });
});


module.exports = router;