const mongoose = require("mongoose");
const { CONFIG } = require("../constants/config");

const ScheduleActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user', // Reference to the child user
        required: true,
    },
    activityIds: [{
        type: mongoose.Types.ObjectId,
        ref: 'Activity', 
        required: true,
    }],
    scheduledDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
}, { timestamps: true });


ScheduleActivitySchema.pre('save', async function (next) {
    const user = await mongoose.model('user').findById(this.userId);
    if (!user || user.accountType !== CONFIG.ACCOUNT_TYPE.CHILD) {
        const error = new Error('Activities can only be associated with children accounts.');
        return next(error);
    }
    next();
});

module.exports = mongoose.model("ScheduledActivity", ScheduleActivitySchema);
