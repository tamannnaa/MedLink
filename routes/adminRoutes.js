const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorSchema");
const Record = require("../models/recordSchema");
const Patient = require("../models/patientSchema");
const Appointment=require("../models/appointmentSchema.js")
const { isAdmin,isAuthenticated } = require("../middleware/authmiddleware");
const { sendEmail, upload } = require("../server2.js");
const fs=require("fs");
const path=require("path")

// Admin Dashboard
router.get('/admindashboard',isAdmin, async (req, res) => {
    res.render('admindashboard');
});

// View Doctor Details
router.get("/viewdoctor/:id",isAuthenticated, async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
        res.render("viewdoctor", { doctor });
    } else {
        res.status(404).send("Doctor not found.");
    }
});

// Approve Doctor
router.get("/approve/:id",isAdmin, async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
        doctor.status = "approved"; // Update the status
        await doctor.save();
        sendEmail(
            doctor.email,
            "Doctor Application Approved",
            `
            <html>
                <body style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4; margin: 0; text-align: center;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); width: 600px; margin: auto;">
                        <h2 style="color: #4CAF50;">Your Application Has Been Approved!</h2>
                        <p>Dear Dr. ${doctor.name},</p>
                        <p>We are pleased to inform you that your application has been approved. You are now cleared to proceed with the next steps.</p>
                        <p>Best regards,</p>
                        <p style="color: #4CAF50; font-weight: bold;">The MedLink Team</p>
                        <footer style="margin-top: 20px; font-size: 12px; color: #777;">
                            <p>&copy; 2024 The MedLink Team | All Rights Reserved</p>
                        </footer>
                    </div>
                </body>
            </html>
            `
        );
        
        res.redirect("/admindashboard");
    } else {
        res.status(404).send("Doctor not found.");
    }
});

// Reject Doctor with Reason
router.get("/reject/:id", isAdmin, async (req, res) => {
    const doctor = await Doctor.findById(req.params.id); // Fetch the doctor by ID
    if (doctor) {
        // Pass doctorId to the EJS template
        res.render('reject-reason', { doctorId: doctor._id }); 
    } else {
        res.status(404).send("Doctor not found.");
    }
});



router.post("/reject/:id", isAdmin, async (req, res) => {
    const { reason } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    
    if (doctor) {
        doctor.status = "rejected"; // Set status as rejected
        doctor.rejectionReason = reason; // Save the reason for rejection
        await doctor.save();

        // Send rejection email
        sendEmail(
            doctor.email,
            "Doctor Application Rejected",
            `
            <html>
                <body style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4; margin: 0; text-align: center;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); width: 600px; margin: auto;">
                        <h2 style="color: #f44336;">Your Application Has Been Rejected</h2>
                        <p>Dear Dr. ${doctor.name},</p>
                        <p>We regret to inform you that your application has been rejected for the following reason:</p>
                        <p><strong style="color: #f44336;">${reason}</strong></p>
                        <p>We encourage you to review the feedback and consider applying again in the future.</p>
                        <p>Best regards,</p>
                        <p style="color: #f44336; font-weight: bold;">The MedLink Team</p>
                        <footer style="margin-top: 20px; font-size: 12px; color: #777;">
                            <p>&copy; 2024 The MedLink Team | All Rights Reserved</p>
                        </footer>
                    </div>
                </body>
            </html>
            `
        );
        
        res.redirect("/admindashboard");
    } else {
        res.status(404).send("Doctor not found.");
    }
});


// route for viewing all doctors
router.get('/adminviewdoctor', isAdmin, async (req, res) => {
    const pendingDoctors = await Doctor.find({ status:'pending'});
    const approvedDoctors = await Doctor.find({ status: 'approved' });
    const rejectedDoctors = await Doctor.find({ status: 'rejected' });
    res.render('adminviewdoctor',{
        pendingDoctors,
        approvedDoctors,
        rejectedDoctors,
    });
});


// Route for viewing appointments with search functionality
router.get('/adminviewappointment', isAdmin, async (req, res) => {
    try {
        const { search } = req.query;  // Get search query from URL

        let filter = { status: 'approved' };  // Default filter for approved appointments

        if (search) {
            filter.$or = [
                { 'patientId.name': { $regex: search, $options: 'i' } },  // Search by patient name (case-insensitive)
                { 'doctorId.name': { $regex: search, $options: 'i' } },   // Search by doctor name (case-insensitive)
                { 'patientId.mpd': { $regex: search, $options: 'i' } }     // Search by mpd (case-insensitive)
            ];
        }

        // Fetch approved appointments based on the search query
        const appointments = await Appointment.find(filter)
            .populate('patientId', 'name phone mpd')  // Include mpd for the patient
            .populate('doctorId', 'name');  // Include doctor name

        // Render the page with filtered appointments
        res.render('adminviewappointment', { appointments });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        res.status(500).send("Internal Server Error");
    }
});



// Route to upload test reports
router.get('/adminuploadreports', isAdmin, async (req, res) => {
    const patients = await Patient.find(); // Fetch patients list
    res.render('adminuploadreports', { patients });
});

// Route to handle report upload
router.post('/adminuploadreports', isAdmin, upload.array('test_reports', 10), async (req, res) => {
    const { mpd, reportType, reportDate } = req.body; // Use mpd here
    const files = req.files;

    console.log(req.body);  // Add this to see the incoming data

    // Enhanced input validation
    if (!mpd || !reportType || !reportDate) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields: mpd, reportType, or reportDate"
        });
    }

    // Ensure files are uploaded
    if (!files || files.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No files uploaded"
        });
    }

    try {
        // Find the patient by mpd
        const patient = await Patient.findOne({ mpd });  // Change from findById to findOne by mpd
        if (!patient) {
            // Clean up uploaded files if patient not found
            files.forEach(file => {
                fs.unlink(file.path, err => {
                    if (err) console.error('Error deleting file:', err);
                });
            });
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        // Find the patient's latest record or create a new one
        const record = await Record.findOne({ patientId: patient._id }).sort({ date: -1 });
        if (!record) {
            // Handle the case where there's no record for the patient (this could be an edge case)
            return res.status(404).json({
                success: false,
                message: "No record found for the patient"
            });
        }

        // Prepare the test report data with relative paths and additional metadata
        const testReports = files.map(file => ({
            reportType,
            reportDate: new Date(reportDate),
            reportFile: path.relative(path.join(__dirname, '..', 'upload'), file.path),
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadDate: new Date()
        }));

        // Append the test reports to the existing record
        record.testReports.push(...testReports);

        // Save the updated record
        await record.save();

        sendEmail(
            patient.email,
            "New Test Reports Uploaded",
            `
            <html>
                <body style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f4f4f4; margin: 0; text-align: center;">
                    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); width: 600px; margin: auto;">
                        <h2 style="color: #4CAF50;">New Test Reports Uploaded!</h2>
                        <p>Dear ${patient.name},</p>
                        <p>We wanted to let you know that new test reports have been uploaded to your account.</p>
                        <p><strong>Report Type:</strong> ${reportType}</p>
                        <p><strong>Report Date:</strong> ${new Date(reportDate).toLocaleDateString()}</p>
                        <p>You can view these reports by logging into your account on our platform.</p>
                        <p>Best regards,</p>
                        <p style="color: #4CAF50; font-weight: bold;">The MedLink Team</p>
                        <footer style="margin-top: 20px; font-size: 12px; color: #777;">
                            <p>&copy; 2024 The MedLink Team | All Rights Reserved</p>
                        </footer>
                    </div>
                </body>
            </html>
            `
        );


        res.status(200).render('admindashboard',{
            success: true,
            message: "Reports uploaded and record updated successfully",
            uploadedFiles: testReports.length
        });
    } catch (error) {
        // Clean up uploaded files in case of error
        files.forEach(file => {
            fs.unlink(file.path, err => {
                if (err) console.error('Error deleting file:', err);
            });
        });

        console.error("Error uploading reports:", error);
        res.status(500).render('adminuploadreports',{
            success: false,
            message: "An error occurred while uploading the reports",
            error: error.message
        });
    }
});



module.exports = router;