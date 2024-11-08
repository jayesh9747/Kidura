const User = require("../models/User")
const { errorFunction } = require('../utils/errorFunction')
const _ = require('lodash');
const MobileUsage = require("../models/mobileUsage")
const Interest = require('../models/interest');
const { CONFIG } = require("../constants/config");
const moment = require("moment");
const ScheduledActivity = require('../models/ScheduledActivity');
exports.addChildUnderMe = async (req, res) => {
    try {
        const userId = req.user.id; // Parent's ID from the authenticated user
        const { firstName, lastName, age, platform } = req.body;

        console.log(req.body);

        // Fetch the parent user from the database
        const parent = await User.findById(userId);

        // Check if the child already exists under the parent
        const existingChild = await User.findOne({
            firstName,
            lastName,
            age,
            parentAccount: parent._id,
            accountType: 'Child'
        });

        console.log("this is eixiting child", existingChild);

        if (existingChild) {
            return res.status(409).json(
                errorFunction(false, "Your child is already under you.")
            );
        }

        // Create a new child account under the parent
        const childData = {
            firstName,
            lastName,
            age,
            accountType: 'Child',
            parentAccount: parent._id,
            platform
        };

        const newChild = await User.create(childData);

        return res.status(200).json({
            success: true,
            data: newChild,
            message: "Child added successfully"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            errorFunction(false, "An error occurred while adding the child.", error.message)
        );
    }
};

exports.GetChildrenMobileUsage = async (req, res) => {
    try {
        const parentId = req.user.id;

        // Step 1: Find all children of the parent
        const children = await User.find({ parentAccount: parentId, accountType: "Child" });

        if (!children.length) {
            return res.status(404).json(
                errorFunction(false, "No children found for this parent.")
            );
        }

        // Step 2: Extract user IDs of children
        const childIds = children.map(child => child._id);

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the beginning of today

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1); // Set to the beginning of tomorrow

        const mobileUsageData = await MobileUsage.find({
            userId: { $in: childIds }
        })
            .sort({ updatedAt: -1 })
            .limit(1);

        return res.status(200).json({
            success: true,
            message: "Children mobile usage data retrieved successfully",
            data: mobileUsageData
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json(
            errorFunction(false, "An error occurred while retrieving the children's mobile usage data.", error.message)
        );
    }
};


exports.UpdateOrCreateInterest = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { childrenId, ...interestData } = req.body;

        console.log("thisisiisis ",);

        // Check if the child is associated with the parent
        const child = await User.findOne({ _id: childrenId, parentAccount: parentId, accountType: CONFIG.ACCOUNT_TYPE.CHILD });
        if (!child) {
            return res.status(403).json(
                errorFunction(true, 'Invalid child ID or not associated with parent')
            );
        }

        console.log(child);

        // Check if an interest document exists for this child
        let interest = await Interest.findOne({ userId: childrenId });

        console.log("interest", interest);

        if (interest) {
            // Update existing interest with only provided fields in `interestData`
            for (const key in interestData) {
                if (interestData.hasOwnProperty(key)) {
                    interest[key] = interestData[key];
                }
            }
            await interest.save();
        } else {
            // Create new interest document if none exists
            interest = new Interest({ ...interestData, userId: childrenId });
            await interest.save();
        }

        // Send the response with success
        return res.status(200).json(
            errorFunction(true, 'Interest data updated successfully', interest)
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            errorFunction(true, 'An error occurred', error.message)
        );
    }
};


exports.GetInterestDataForChild = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { childrenId } = req.query;

        console.log("this is childrenId", parentId);

        // Verify that the child is associated with the parent and has accountType 'children'
        const child = await User.findOne({ _id: childrenId, parentAccount: parentId, accountType: CONFIG.ACCOUNT_TYPE.CHILD });
        if (!child) {
            return res.status(403).json(
                errorFunction(false, 'Invalid child ID or not associated with parent')
            );
        }

        // Retrieve the interest data for the specified child
        const interest = await Interest.findOne({ userId: childrenId });
        if (!interest) {
            return res.status(404).json(
                errorFunction(false, 'Interest data not found for the specified child')
            );
        }

        // Send the response with the interest data
        return res.status(200).json(
            errorFunction(true, 'Interest data retrieved successfully', interest)
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            errorFunction(false, 'An error occurred while retrieving interest data', error.message)
        );
    }
};


exports.GetTodayActivitiesForChild = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { childrenId } = req.query;

        console.log("This is childrenId:", childrenId);

        // Verify that the child is associated with the parent and has accountType 'children'
        const child = await User.findOne({ _id: childrenId, parentAccount: parentId, accountType: CONFIG.ACCOUNT_TYPE.CHILD });
        if (!child) {
            return res.status(403).json(
                errorFunction(true, 'Invalid child ID or not associated with parent')
            );
        }

        // Define today's start and end timestamps
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        // Retrieve today's activities with scores for the specified child
        const activities = await Activity.find({
            userId: childrenId,
            activityDate: { $gte: todayStart, $lte: todayEnd }
        }, {
            activityName: 1,
            description: 1,
            benefits: 1,
            timings: 1,
            reward: 1,
            competitiveSpirit: 1,
            enjoymentLevel: 1,
            challengeAcceptance: 1,
            taskCompletion: 1
        });

        if (!activities.length) {
            return res.status(404).json(
                errorFunction(true, 'No activities found for the specified child today')
            );
        }

        // Send the response with today's activities and scores
        return res.status(200).json(
            errorFunction(true, 'Today\'s activities retrieved successfully', activities)
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            errorFunction(true, 'An error occurred while retrieving activities data', error.message)
        );
    }
};




exports.SetDailyScheduledActivity = async (req, res) => {
    try {
        const { childrenId, activityId, scheduledDate } = req.body;
        const parentId = req.user.id;

        // Verify the child belongs to the parent
        const child = await User.findOne({ _id: childrenId, parentAccount: parentId, accountType: CONFIG.ACCOUNT_TYPE.CHILD });
        if (!child) {
            return res.status(403).json(
                errorFunction(true, 'Invalid child ID or not associated with parent')
            );
        }

        // Convert scheduledDate to a Date object
        const scheduleDate = new Date(scheduledDate);

        // Create or update scheduled activity for the specific day
        const scheduledActivity = await ScheduledActivity.findOneAndUpdate(
            { userId: childrenId, scheduledDate: scheduleDate, activityId },
            { userId: childrenId, scheduledDate: scheduleDate, activityId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return res.status(200).json(
            errorFunction(false, 'Scheduled activity set successfully', scheduledActivity)
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json(
            errorFunction(true, 'An error occurred while setting scheduled activity', error.message)
        );
    }
};

exports.GetScheduledActivities = async (req, res) => {
    try {
        const parentId = req.user.id;
        const { childrenId } = req.query;

        const child = await User.findOne({ _id: childrenId, parentAccount: parentId, accountType: CONFIG.ACCOUNT_TYPE.CHILD });
        if (!child) {
            return res.status(403).json(
                errorFunction(true, 'Invalid child ID or not associated with parent')
            );
        }

        // Parse date to filter activities scheduled for this day
        const scheduledDate = new Date(date);
        const nextDay = new Date(scheduledDate);
        nextDay.setDate(scheduledDate.getDate() + 1);


        // Find the schedule for the given child on a specific date
        const schedule = await ScheduleActivity.findOne({
            childrenId: childrenId,
            scheduledDate,
        }).populate('activityIds');  // Populating the activity details

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "No scheduled activities found for the given date",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Scheduled activities retrieved successfully",
            data: schedule,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching scheduled activities",
            error: error.message,
        });
    }
};
