// ============================================
// models/FIR.js — Mongoose Schema & Model
// ============================================

const mongoose = require('mongoose');

const firSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
    },
    police_station: {
      type: String,
      required: [true, 'Police station is required'],
      trim: true,
    },
    fir_no: {
      type: String,
      required: [true, 'FIR number is required'],
      unique: true,
      trim: true,
    },
    fir_date: {
      type: String,          // stored as "YYYY-MM-DD" string
      required: [true, 'FIR date is required'],
    },
    sections: {
      type: String,
      required: [true, 'Sections are required'],
      trim: true,
    },
    io_name: {
      type: String,
      required: [true, 'Investigating Officer name is required'],
      trim: true,
    },
    io_mobile: {
      type: String,
      required: [true, 'IO mobile number is required'],
      match: [/^\d{10}$/, 'Mobile number must be exactly 10 digits'],
    },
    status: {
      type: String,
      enum: ['open', 'investigation', 'closed'],
      default: 'open',
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,   // adds createdAt and updatedAt automatically
  }
);

module.exports = mongoose.model('FIR', firSchema);