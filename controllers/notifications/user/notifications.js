const User = require("../../../models/User");

const getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the admin user by ID and populate their notifications
    const user = await User.findById(userId)
      .populate("notifications")
      .exec();

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    // Extract the notifications from the admin user object
    const notifications = user.notifications;

    return res.status(200).json({ notifications });
  } catch (error) {
    // console.error('Error retrieving admin notifications:', error);
    return res
      .status(500)
      .json({ message: "Error retrieving admin notifications" });
  }
};

module.exports = {
  getUserNotifications
};
