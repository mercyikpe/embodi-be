const SubscriptionPlan = require("../models/Subscription");


const createSubscription = async (req, res) => {
    try {
        const {
            userId,
            type,
            duration,
            consultationsCount,
            questionnairesCount,
            subscriptionDate,
            expiryDate,
            remainingMonths,
        } = req.body;


        await SubscriptionPlan.deleteOne({ userId })

        const newSubscription = new SubscriptionPlan({
            userId,
            type,
            duration,
            consultationsCount,
            questionnairesCount,
            subscriptionDate,
            expiryDate,
            remainingMonths,
        });

        // Save the subscription to the database
        await newSubscription.save();

        res.status(201).json({ message: "Subscription created successfully." });
    } catch (error) {
        console.error("Error creating subscription:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Controller to get subscription details by user ID
const getSubscriptionByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        const subscription = await SubscriptionPlan.findOne({ userId });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        res.status(200).json({ subscription });
    } catch (error) {
        console.error("Error getting subscription details:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Controller to update remaining months when a month expires
const expireSubscription = async (req, res) => {
    try {
        const { userId } = req.params;

        const subscription = await SubscriptionPlan.findOne({ userId });

        if (!subscription) {
            return res.status(404).json({ message: "Subscription not found." });
        }

        // Decrement remaining months
        if (subscription.remainingMonths > 0) {
            subscription.remainingMonths--;

            // Save the updated subscription
            await subscription.save();
        }

        res.status(200).json({ message: "Subscription updated successfully." });
    } catch (error) {
        console.error("Error updating subscription:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = {
    createSubscription,
    getSubscriptionByUserId,
    expireSubscription,
};
