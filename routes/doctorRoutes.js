const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorSchema");
const Patient = require("../models/patientSchema");
const Appointment = require("../models/appointmentSchema");
const Record = require("../models/recordSchema");
const { sendEmail } = require("../server2.js");

const { isDoctor } = require("../middleware/authmiddleware");

// Doctor Dashboard
router.get("/doctordashboard",isDoctor,async(req,res)=>{
    const doctor= await Doctor.findById(req.session.userId);
    if(doctor){
        res.render("doctordashboard",{doctor,role:req.session.role});
    }
    else{
        res.send("Doctor Not Found");
    }
    
});

//Doctor Profiles 
router.get("/doctorprofile",isDoctor,async(req,res)=>{
    const doctor= await Doctor.findById(req.session.userId);
    if(doctor){
        res.render("doctorprofile",{doctor,role:req.session.role});
    }
    else{
        res.send("Doctor Not Found");
    }
    
});
// Update doctor profile
router.post('/updatedoctorprofile', isDoctor, async (req, res) => {
    const { name, email, phone, specialization, experience, clinicName, clinicAddress, qualifications, consultationFees, onlineAvailability, offlineAvailability } = req.body;

    try {
        // Find the doctor and update the profile
        const doctor = await Doctor.findByIdAndUpdate(req.session.userId, {
            name,
            email,
            phone,
            specialization,
            experience,
            clinicDetails: { name: clinicName, address: clinicAddress },
            qualifications: qualifications.split(',').map(qual => qual.trim()),
            consultationFees,
            availabilitySchedule: {
                online: onlineAvailability.split(',').map(day => day.trim()),
                offline: offlineAvailability.split(',').map(day => day.trim())
            }
        }, { new: true }); // 'new' returns the updated document

        if (doctor) {
            // Redirect to the updated doctor profile or dashboard
            res.redirect('/doctorprofile');
        } else {
            res.status(404).send('Doctor not found');
        }
    } catch (error) {
        console.error("Error updating doctor profile:", error);
        res.status(500).send("An error occurred while updating the profile.");
    }
});


// Update this route to accept appointmentId from query parameters
router.get('/uploadrecord', async (req, res) => {
    const appointmentId = req.query.appointmentId; // Get appointmentId from the query
    console.log('Received appointmentId:', appointmentId); // Log the appointmentId

    try {
        const appointment = await Appointment.findById(appointmentId.toString()).populate('patientId'); // Fetch the appointment and populate the patientId
        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        res.render('addRecord', { 
            appointmentId, 
            patientId: appointment.patientId._id, // Pass the patient ID to the template
            patientName: appointment.patientName // Optional: pass patient name for display
        });
    } catch (error) {
        console.error("Error fetching appointment:", error);
        res.status(500).send("An error occurred while fetching the appointment.");
    }
});

// Upload patient record
router.post('/uploadrecord', isDoctor, async (req, res) => {
    const { patientId, doctorName, diagnosis, medication, notes, appointmentId } = req.body;

    try {
        // Fetch the appointment to get the patient name
        const appointment = await Appointment.findById(appointmentId).populate('patientId');
        if (!appointment) {
            return res.status(404).send("Appointment not found");
        }

        const patientName = appointment.patientId.name; // Assuming the patient model has a 'name' field
        const mpd = appointment.patientId.mpd;
        const patientEmail = appointment.patientId.email; 

        // Create a new record
        const newRecord = new Record({
            patientId,
            patientName, // Add patientName here
            mpd,
            doctorName,
            doctorId: req.session.userId, // Assuming you have doctor's ID in session
            date: new Date(),
            diagnosis,
            medication,
            notes,
        });

        await newRecord.save();

        // Update patient's medical history (optional)
        await Patient.findByIdAndUpdate(patientId, {
            $push: {
                medicalHistory: {
                    diagnosis,
                    prescriptions: [medication],
                    appointmentDate: new Date(),
                    doctorId: req.session.userId,
                }
            }
        });
        const subject = "New Medical Record Uploaded";
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                    <h2 style="text-align: center; color: #4CAF50;">New Medical Record Notification</h2>
                    <p style="font-size: 16px;">Dear ${patientName},</p>
                    <p style="font-size: 16px;">
                        A new medical record has been uploaded for you by Dr. ${doctorName}.
                    </p>
                    <p style="font-size: 16px;">
                        <strong>Diagnosis:</strong> ${diagnosis} <br>
                        <strong>Prescribed Medication:</strong> ${medication} <br>
                        <strong>Additional Notes:</strong> ${notes} <br>
                        <strong>Date:</strong> ${new Date().toLocaleDateString()}
                    </p>
                    <p style="font-size: 16px;">
                        You can view your full medical history and additional details by logging into your patient portal.
                    </p>
                    <hr style="margin: 20px 0;">
                    <p style="font-size: 14px; color: #777;">
                        Regards,<br>
                        MedLink Team<br>
                        <div style="background-color: #f1f1f1; padding: 10px; text-align: center;">
                            <p style="font-size: 12px; color: #777;">&copy; 2024 MedLink, All rights reserved.</p>
                        </div>
                        </p>
                </div>
            </div>
        `;

        sendEmail(patientEmail, subject, html);

        res.redirect('/patients'); // Redirect to a success page or back to the upload form
    } catch (error) {
        console.error("Error uploading record:", error);
        res.status(500).send("An error occurred while uploading the record.");
    }
});

// Fetch patients associated with the doctor's approved appointments
router.get('/patients', isDoctor, async (req, res) => {
    try {
        const currentDoctorId = req.session.userId; // Use userId instead of doctorId
        // Find all patients whose doctorName matches the current logged-in doctor
        const patients = await Patient.find({
            'medicalHistory.doctorId': currentDoctorId // Filter for patients whose doctorId matches the current doctor
        }).populate('medicalHistory.doctorId'); // Populate the doctorId to get doctor details

        // Log the patients object to check if medicalHistory is populated correctly
        console.log(patients);
        patients.forEach(patient => {
            console.log(patient.medicalHistory);  // Log medical history to check structure
        });

        // Send the filtered patients to the view
        res.render('patients', { patients });
    } catch (error) {
        console.error("Error fetching patients' medical history:", error);
        res.status(500).json({ success: false, message: 'Error fetching patients' });
    }
});





module.exports = router;

