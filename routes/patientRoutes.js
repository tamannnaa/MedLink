const express = require("express");
const router = express.Router();
const Patient = require("../models/patientSchema");
const Doctor = require("../models/doctorSchema");
const Appointment = require("../models/appointmentSchema");
const Record = require("../models/recordSchema");
const { isPatient } = require("../middleware/authmiddleware");

// Patient Dashboard
router.get("/patientdashboard", isPatient, async (req, res) => {
    try {
        const patient = await Patient.findById(req.session.userId);
        const doctors = await Doctor.find();
        
        if (patient) {
            // Save patient data to session
            req.session.patient = patient;
            
            res.render("patientdashboard", {
                patient,
                doctors,
                role: req.session.role,
            });
        } else {
            res.send("Patient Not Found");
        }
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).send("An error occurred while loading the dashboard.");
    }
});
router.get('/patientprofile', isPatient, async (req, res) => {
    try {
        let patient = req.session.patient;

        if (!patient) {
            patient = await Patient.findById(req.session.userId);
            req.session.patient = patient;
        }

        // Fetch appointments with populated doctor data
        const appointments = await Appointment.find({ patientId: req.session.userId })
            .populate('doctorId', 'name')
            .lean();

        // Separate appointments by status
        const approvedAppointments = appointments.filter(app => app.status === 'approved');
        const pendingAppointments = appointments.filter(app => app.status === 'pending');
        const canceledAppointments = appointments.filter(app => app.status === 'canceled'); // New filter

        // Fetch previous records linked to the patient
        const records = await Record.find({ patientId: req.session.userId });

        // Render the patient profile with categorized data
        res.render('patientprofile', { 
            patient, 
            approvedAppointments, 
            pendingAppointments, 
            canceledAppointments, // Pass canceled appointments to template
            records 
        });
    } catch (error) {
        console.error("Error fetching profile data:", error);
        res.status(500).send("An error occurred while fetching profile data.");
    }
});

// Route to see reports of a patient
router.get('/seereports/:mpd', isPatient, async (req, res) => {
    const { mpd } = req.params;  // Get 'mpd' from the query parameter

    // If 'mpd' is not provided, return an error response
    if (!mpd) {
        return res.status(400).send("MPD is required to view reports.");
    }

    try {
        // Find the patient by the 'mpd' value
        const patient = await Patient.findOne({ mpd });

        // If the patient with the provided 'mpd' is not found, return an error response
        if (!patient) {
            return res.status(404).send("Patient not found.");
        }

        // Find the records associated with the patient (by mpd or patientId)
        const records = await Record.find({ mpd});  // Use patientId to find related records

        // If no records are found, return an error
        if (records.length === 0) {
            return res.status(404).send("No records found for this patient.");
        }

        // Collect all the test reports from the records
        const testReports = records.reduce((acc, record) => {
            // Adjust path to be URL-compatible
            record.testReports.forEach(report => {
                report.reportFile = report.reportFile.replace(/\\/g, '/');
            });
            return acc.concat(record.testReports);
        }, []);

        console.log(testReports);

        console.log(records.reportFile); // Ensure this matches the actual file path on the server

        // Render the 'seereports' view with patient data and test reports
        res.render('seereports', {
            patient,
            testReports
        });

    } catch (error) {
        console.error("Error fetching reports:", error);
        res.status(500).send("An error occurred while fetching reports.");
    }
});

router.post('/cancelAppointment/:id', isPatient, async (req, res) => {
    const appointmentId = req.params.id;

    try {
        // Find the appointment by ID and update its status
        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status: 'canceled' },
            { new: true }  // Return the updated appointment
        );

        if (appointment) {
            res.json({ success: true, message: 'Appointment canceled successfully.' });
        } else {
            res.json({ success: false, message: 'Appointment not found.' });
        }
    } catch (error) {
        console.error("Error canceling appointment:", error);
        res.status(500).json({ success: false, message: 'An error occurred while canceling the appointment.' });
    }
});




module.exports = router;