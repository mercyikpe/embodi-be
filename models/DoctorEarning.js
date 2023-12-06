const mongoose = require("mongoose");

// MonthlyEarning schema to store details of monthly earnings
const MonthlyEarningSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  patientCount: {
    type: Number,
    default: 0,
  },
  earnings: {
    type: Number,
    default: 0,
  },
});

module.exports = MonthlyEarningSchema;
