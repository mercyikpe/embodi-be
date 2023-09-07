const Notifications = require("../../../models/Notification");
const User = require("../../../models/User");

const getAdminNotifications = async (req, res) => {
  try {
    const adminUserId = req.params.adminId;

    // Find the admin user by ID and populate their notifications
    const admin = await User.findById(adminUserId)
      .populate("notifications")
      .exec();

    if (!admin) {
      return res.status(404).json({ message: "Account not an admin." });
    }

    // Extract the notifications from the admin user object
    const notifications = admin.notifications;

    return res.status(200).json({ notifications });
  } catch (error) {
    // console.error('Error retrieving admin notifications:', error);
    return res
      .status(500)
      .json({ message: "Error retrieving admin notifications" });
  }
};

module.exports = {
  getAdminNotifications,
};
