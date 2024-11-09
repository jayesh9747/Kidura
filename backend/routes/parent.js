
const express = require('express');
const router = express.Router();
const Joi = require('joi');


const { addChildUnderMe, GetChildrenMobileUsage, UpdateOrCreateInterest, GetInterestDataForChild } = require('../controllers/parent');
const { isParent } = require('../middleware/auth');

const endpoints = {
    ADD_CHILD: '/add-child',
    GET_MOBILE_USAGE: "/mobile-usage",
    INSERT_UPDATE_CHILDREN_INTEREST: "/child/interest",
    GET_CHILD_INTEREST: "/child/get/interest"
};

const JoinUnderMeSchema = Joi.object({
    firstName: Joi.string().required().messages({
        'any.required': 'First name is required',
    }),
    lastName: Joi.string().required().messages({
        'any.required': 'Last name is required',
    }),
    age: Joi.number().integer().min(0).required().messages({
        'any.required': 'Age is required',
        'number.base': 'Age must be a number',
        'number.integer': 'Age must be an integer',
        'number.min': 'Age must be at least 0',
    }),
    platform: Joi.string().required().messages({
        'any.required': 'Platform is required',
    }),
});

const validateJoinUnderMe = (req, res, next) => {
    // Validate the request body against the schema
    const { error } = JoinUnderMeSchema.validate(req.body, { abortEarly: false });

    // If there's an error, return a 400 response with the error details
    if (error) {
        const errorMessages = error.details.map(err => err.message);
        return res.status(400).json({
            success: false,
            errors: errorMessages,
        });
    }

    // Continue if validation is successful
    next();
};

/*
url : localhost:4000/api/v1/parent/add-child
 */
router.post(endpoints.ADD_CHILD, isParent, validateJoinUnderMe, addChildUnderMe);

/*
url : localhost:4000/api/v1/parent/mobile-usage
 */
router.get(endpoints.GET_MOBILE_USAGE, isParent, GetChildrenMobileUsage);

/*
url : localhost:4000/api/v1/child/interest
 */
router.post(endpoints.INSERT_UPDATE_CHILDREN_INTEREST, isParent, UpdateOrCreateInterest);

/*
url : localhost:4000/api/v1/parent/child/get/interest?childrenId=672df6b26045c53f2271c587
 */
router.get(endpoints.GET_CHILD_INTEREST, isParent, GetInterestDataForChild);


module.exports = router;
