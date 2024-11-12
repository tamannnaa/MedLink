const express = require('express');
const cron=require("node-cron")
const router = express.Router();
const Appointment = require('../models/appointmentSchema');
const Patient = require('../models/patientSchema');
const { sendEmail } = require("../server2.js");
// Middleware imports
const { isAuthenticated, isDoctor, isPatient, isAdmin } = require('../middleware/authmiddleware');

// Schedule the task to run every day at 8:00 AM
cron.schedule('0 8 * * *', async () => {
    try {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

        // Find appointments scheduled for today
        const appointmentsToday = await Appointment.find({
            date: today,
            status: 'approved'
        }).populate('patientId', 'name email');

        // Loop through each appointment and send a reminder email
        for (const appointment of appointmentsToday) {
            if (appointment.patientId && appointment.patientId.email) {
                const subject = `Reminder: Appointment Today at ${appointment.time}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                            <h2 style="text-align: center; color: #4CAF50;">Appointment Reminder</h2>
                            <p style="font-size: 16px;">Dear ${appointment.patientId.name},</p>
                            <p style="font-size: 16px;">This is a reminder that you have an appointment scheduled today at <strong>${appointment.time}</strong>.</p>
                            <p style="font-size: 16px;">Please be on time and contact us if you need any further assistance.</p>
                            <hr style="margin: 20px 0;">
                            <p style="font-size: 14px; color: #777;">
                                Regards,<br>
                                MedLink Team
                            </p>
                            <div style="background-color: #f1f1f1; padding: 10px; text-align: center;">
                                <p style="font-size: 12px; color: #777;">&copy; 2024 MedLink, All rights reserved.</p>
                            </div>
                        </div>
                    </div>
                `;

                // Send the email
                try {
                    await sendEmail(appointment.patientId.email, subject, html);
                    console.log(`Reminder sent to ${appointment.patientId.name} at ${appointment.time}`);
                } catch (emailError) {
                    console.error('Error sending reminder email:', emailError);
                }
            }
        }
    } catch (error) {
        console.error('Error running daily reminder cron job:', error);
    }
});

router.post('/book', isPatient, async (req, res) => {
    try {
        const { doctorId, date, time, type } = req.body;
        const patient = await Patient.findById(req.session.userId).select('name mpd');
        
        // Check if the slot is available
        const existingAppointment = await Appointment.findOne({
            doctorId,
            date,
            time,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return res.status(400).json({ 
                success: false, 
                message: 'This time slot is already booked' 
            });
        }

        const appointment = new Appointment({
            patientId: req.session.userId,
            patientName: patient.name,
            doctorId,
            date,
            time,
            type,
            mpd: patient.mpd
        });
        
        await appointment.save();

        // Redirect with a success message after booking
        return res.status(200).json({
            success: true,
            message: 'Appointment requested, please wait for confirmation',
            redirectUrl: '/patientdashboard'
        });

    } catch (error) {
        console.error('Booking error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Error booking appointment' 
        });
    }
});


// Get patient's appointments
router.get('/patientappointments', isPatient, async (req, res) => {
    try {
        const appointments = await Appointment.find({ 
            patientId: req.session.userId,
            status: 'approved'
        })
        .populate('doctorId', 'name specialization')
        .sort({ date: 1, time: 1 });
        
        res.render('patientAppointments', { appointments });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).send('Error fetching appointments');
    }
});

router.get('/doctorappointments', isDoctor, async (req, res) => {
    try {
        const appointments = await Appointment.find({ 
            doctorId: req.session.userId 
        })
        .populate('patientId', 'name phone email')
        .sort({ date: 1, time: 1 });

        if (!appointments || appointments.length === 0) {
            return res.render('doctorAppointments', { appointments: [] }); // Handle case where no appointments are found
        }

        res.render('doctorAppointments', { appointments });
    } catch (error) {
        console.error('Fetch error:', error);
        res.status(500).send('Error fetching appointments');
    }
});


// Update appointment status
router.patch('/status/:id', isDoctor, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected','cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
        const appointment = await Appointment.findById(req.params.id)
            .populate('patientId', 'name email');

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        if (appointment.doctorId.toString() !== req.session.userId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to update this appointment'
            });
        }

        appointment.status = status; // Update the status as provided (approved or rejected)
        await appointment.save();
        
        if (appointment.patientId && appointment.patientId.email) {
            const subject = `Your Appointment has been ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            const html = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
                        <h2 style="text-align: center; color: #4CAF50;">MedLink Appointment Notification</h2>
                        <p style="font-size: 16px;">Dear ${appointment.patientId.name},</p>
                        <p style="font-size: 16px;">We would like to inform you that your appointment scheduled on 
                        <strong>${appointment.date}</strong> at <strong>${appointment.time}</strong> has been 
                        <span style="font-weight: bold; color: ${status === 'approved' ? '#4CAF50' : '#FF0000'};">
                        ${status}</span>.</p>
                        <p style="font-size: 16px;">Please reach out if you have any questions or need further assistance.</p>
                        <hr style="margin: 20px 0;">
                        <p style="font-size: 14px; color: #777;">
                            Regards,<br>
                            MedLink Team
                        </p>
                        <div style="background-color: #f1f1f1; padding: 10px; text-align: center;">
                            <p style="font-size: 12px; color: #777;">&copy; 2024 MedLink, All rights reserved.</p>
                        </div>
                    </div>
                </div>
            `;

            try {
                await sendEmail(appointment.patientId.email, subject, html);
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Continue with the response even if email fails
            }
        }


        res.json({
            success: true,
            message: `Appointment status updated to ${status} successfully`
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating appointment status'
        });
    }
});

// Cancel appointment (for patients)
router.patch('/cancel/:id', isPatient, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        
        if (!appointment) {
            return res.status(404).json({ 
                success: false, 
                message: 'Appointment not found' 
            });
        }

        if (appointment.patientId.toString() !== req.session.userId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized to cancel this appointment' 
            });
        }
        
        appointment.status = 'cancelled';
        await appointment.save();
        
        res.json({ 
            success: true, 
            message: 'Appointment cancelled successfully' 
        });
    } catch (error) {
        console.error('Cancellation error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error cancelling appointment' 
        });
    }
});

module.exports = router;
