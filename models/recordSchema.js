
const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
    },
    patientName: {
        type: String,
    },
    mpd: { // Add MPD field
        type: String,
        required: true // Make it required
    },
    doctorName: {
        type: String,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
    },
    date: {
        type: Date,
        required: true
    },
    diagnosis: {
        type: String,
    },
    medication: {
        type: String,
    },
    testReports: [
        {
            reportType: {
                type: String, 
            },
            reportDate: {
                type: Date,
            },
            reportFile: {
                type: String, 
            }
        }
    ],
    notes: {
        type: String, // Additional notes from the doctor
        default: ""
    }
});

module.exports = mongoose.model('Record', recordSchema);
