const User = require('../models/User');
const Report = require('../models/Report');
const CustomRequest = require('../models/CustomRequest');

const CREATOR_MIN_DAYS = 7;
const CREATOR_MIN_DELIVERED = 3;
const REPORT_WINDOW_DAYS = 7;
const REPORTS_SUSPEND_CONTENT = 3;
const REPORTS_SUSPEND_PROFILE = 5;
const SUSPEND_DAYS = 7;

const daysAgo = (days) => new Date(Date.now() - days * 86400000);

const shouldUnsuspend = (user) => {
    if (!user.isSuspended) return false;
    if (!user.suspendedUntil) return true;
    return user.suspendedUntil.getTime() <= Date.now();
};

const shouldVerifyCreator = async (user) => {
    if (!user.ageVerifiedAt) return false;
    if (user.role !== 'creator') return false;
    const createdAt = user.createdAt || new Date();
    const minDate = daysAgo(CREATOR_MIN_DAYS);
    if (createdAt > minDate) return false;

    const deliveredCount = await CustomRequest.countDocuments({
        creator: user._id,
        status: 'delivered',
    });
    if (deliveredCount < CREATOR_MIN_DELIVERED) return false;

    const openReports = await Report.countDocuments({
        targetType: 'user',
        targetId: user._id.toString(),
        status: { $in: ['open', 'reviewing'] },
    });
    return openReports === 0;
};

const getReportCount = async (userId) => {
    const since = daysAgo(REPORT_WINDOW_DAYS);
    return Report.countDocuments({
        targetType: 'user',
        targetId: userId.toString(),
        createdAt: { $gte: since },
    });
};

const enforceCreatorModeration = async (user) => {
    if (user.role !== 'creator') return;

    const reportCount = await getReportCount(user._id);
    const now = new Date();

    if (reportCount >= REPORTS_SUSPEND_PROFILE) {
        user.isSuspended = true;
        user.suspendedUntil = new Date(now.getTime() + SUSPEND_DAYS * 86400000);
    } else if (reportCount >= REPORTS_SUSPEND_CONTENT) {
        user.isSuspended = true;
        user.suspendedUntil = new Date(now.getTime() + SUSPEND_DAYS * 86400000);
    } else if (shouldUnsuspend(user)) {
        user.isSuspended = false;
        user.suspendedUntil = null;
    }
};

const refreshCreatorStatus = async (userId) => {
    const user = await User.findById(userId);
    if (!user) return null;

    if (user.role === 'creator') {
        await enforceCreatorModeration(user);
        const canVerify = await shouldVerifyCreator(user);
        user.verifiedCreator = canVerify;
    }

    await user.save();
    return user;
};

module.exports = {
    refreshCreatorStatus,
    enforceCreatorModeration,
};
