const mongoose = require('mongoose');

// Create a new schema for accident and payment
const accidentSchema = new mongoose.Schema({
    fullName: String,
    age: Number,
    gender: String,
    emergencyContactName: String,
    emergencyContactPhone: String,
    medicalHistory: [String],
    consentTreatment: String,
    injuryDateTime: Date,
    injuryDescription: String,
    severity: String,
    consentAnesthesia: String,
    paymentAmount: Number,
    cardNumber: String,
    paymentStatus: { type: String, default: 'Pending' }, // "Pending" or "Completed"
    bedBooked: { type: Boolean, default: false },
    dateOfBooking: { type: Date, default: Date.now }
});

// Create a model
const Accident = mongoose.model('Accident', accidentSchema);

module.exports = Accident;
