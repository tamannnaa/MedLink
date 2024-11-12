const mongoose=require("mongoose");
const doctorSchema = new mongoose.Schema({
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
    password: {
      type: String,
      required: true,
    },
    rejectionReason: {
      type: String,
    },    
    specialization: {
      type: String,
      required: true,
    },
    experience: Number,
    clinicDetails: {
      name: String,
      address: String,
    },
    qualifications: [String],
    consultationFees: Number,
    ratings: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        patientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Patient',
        },
        reviewText: String,
        rating: Number,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    availabilitySchedule: {
      online: [String],
      offline: [String],
    },
    documents: [
      {
        fileName: String,
        fileUrl: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },role: {
        type: String,
        default: 'doctor',
    },
  }, { timestamps: true });
  
  const Doctor = mongoose.model('Doctor', doctorSchema);
  module.exports = Doctor;
   