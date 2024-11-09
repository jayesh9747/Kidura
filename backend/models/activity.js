const mongoose = require("mongoose");
const { CONFIG } = require("../constants/config");

const ActivitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    benefits: {
        type: String,
        trim: true,
    },
    timings: {
        type: String,
        trim: true,
    },
    reward: {
        type: Number,
        default: 0,
    },
    activityDate: {
        type: Date,
        default: Date.now,
    },
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    competitiveSpirit: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    enjoymentLevel: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    challengeAcceptance: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    },
    taskCompletion: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
    }
}, {
    timestamps: true,
});

ActivitySchema.pre('save', async function (next) {
    const user = await mongoose.model('user').findById(this.userId);
    if (!user || user.accountType !== CONFIG.ACCOUNT_TYPE.CHILD) {
        const error = new Error('Activities can only be associated with children accounts.');
        return next(error);
    }
    next();
});

module.exports = mongoose.model("Activity", ActivitySchema);
