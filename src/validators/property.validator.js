import { body } from 'express-validator';
import {
    AvailablePropertyTypes,
    AvailableIssueTypes,
    AvailableIssuePriority,
} from '../utils/constants.js';

const propertyDataValidator = () => {
    return [
        body('name').trim().notEmpty().withMessage('Property name is required'),

        body('description')
            .optional()
            .isString()
            .withMessage('Description must be a string'),

        body('country').trim().notEmpty().withMessage('Country is required'),

        body('state').trim().notEmpty().withMessage('State is required'),

        body('city').trim().notEmpty().withMessage('City is required'),

        body('pincode').trim().notEmpty().withMessage('Pincode is required'),

        body('address').trim().notEmpty().withMessage('Address is required'),

        body('type')
            .notEmpty()
            .withMessage('Property type is required')
            .isIn(AvailablePropertyTypes)
            .withMessage(
                `Property type must be one of: ${AvailablePropertyTypes.join(', ')}`,
            ),

        body('rentAmount')
            .notEmpty()
            .withMessage('Rent amount is required')
            .isFloat({ min: 0 })
            .withMessage('Rent amount must be a positive number'),

        body('depositAmount')
            .notEmpty()
            .withMessage('Deposit amount is required')
            .isFloat({ min: 0 })
            .withMessage('Deposit amount must be a positive number'),
    ];
};

const issuesDataValidator = () => {
    return [
        body('type')
            .notEmpty()
            .withMessage('Issue type is required')
            .isIn(AvailableIssueTypes)
            .withMessage(
                `Issue type must be one of: ${AvailableIssueTypes.join(', ')}`,
            ),

        body('description')
            .optional()
            .isString()
            .withMessage('Issue description must be a string'),

        body('priority')
            .optional()
            .isIn(AvailableIssuePriority)
            .withMessage(
                `Issue priority must be one of: ${AvailableIssuePriority.join(', ')}`,
            ),
    ];
};

export { propertyDataValidator, issuesDataValidator };
