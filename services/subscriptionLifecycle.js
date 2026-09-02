const Subscription = require("../models/Subscription");

async function revokeStudentSubscription(user, note = "Subscription revoked because account was permanently blocked.") {
    if (!user) return;
    await Subscription.deleteMany({ userId: user._id });

    user.subscriptionStatus = "inactive";
    user.subscriptionAccess = false;
    user.subscriptionAmount = 200;
    user.subscriptionPaymentReference = "";
    user.subscriptionRequestedAt = null;
    user.subscriptionConfirmedAt = null;
    user.subscriptionConfirmedBy = null;
    user.subscriptionAdminNote = note;
}

module.exports = { revokeStudentSubscription };
