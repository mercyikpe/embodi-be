// Define SubscriptionPlan model
const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema({
    type: {
        type: String, // "individual" or "family"
        required: true,
    },
    duration: {
        type: String, // "monthly" or "yearly"
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    consultationsPerMonth: {
        type: Number,
        required: true,
    },
    questionnairesPerMonth: {
        type: Number,
        required: true,
    },
});

const SubscriptionPlan = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);

module.exports = SubscriptionPlan;