const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String, // "individual" or "family"
    required: true,
  },
  duration: {
    type: String, // "monthly" or "yearly"
    required: true,
  },
  consultationsCount: {
    type: Number,
  },
  questionnairesCount: {
    type: Number,
  },
  subscriptionDate: {
    type: String,
  },
  expiryDate: {
    type: String,
  },

  // yearly plan
  remainingMonths: {
    type: Number, // This field indicates the remaining months
    default: 0,
  },
});

const SubscriptionPlan = mongoose.model(
  "SubscriptionPlan",
  SubscriptionPlanSchema
);

module.exports = SubscriptionPlan;
