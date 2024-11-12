const mongoose=require("mongoose");
const patientSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    mpd: { 
      type: String,
      unique: true,
      required: true 
    }, 
    password: {
      type: String,
      required: true,
    },
    role: {
        type: String,
        default: 'patient',
      },
    medicalHistory: [
      {
        diagnosis: String,
        prescriptions: [String],
        appointmentDate: {
          type: Date,
          default: Date.now,
        },
        doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Doctor',
        },
      },
    ],
    healthDashboard: {
      healthStats: {
        bloodPressure: String,
        heartRate: String,
        cholesterolLevel: String,
      },
      recentConsultations: [
        {
          doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
          },
          date: {
            type: Date,
            default: Date.now,
          },
          notes: String,
        },
      ],
      labReports: [
        {
          reportName: String,
          reportUrl: String,
          date: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      prescriptions: [String],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  }, { timestamps: true });
  
  const Patient = mongoose.model('Patient', patientSchema);
  module.exports = Patient;


