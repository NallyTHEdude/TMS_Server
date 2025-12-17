import { body, query } from 'express-validator';
import {
    AvailablePropertyTypes,
    AvailableIssueTypes,
    AvailableIssuePriority,
    AvailablePropertyStatus,
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

const filterPropertiesValidator = () => {
    return [
        // ---------- LOCATION ----------
        query('state')
            .optional()
            .isString()
            .withMessage('State must be a string'),

        query('city')
            .optional()
            .isString()
            .withMessage('City must be a string'),

        // ---------- STATUS ----------
        query('status')
            .optional()
            .isIn(AvailablePropertyStatus)
            .withMessage(
                `Status must be one of: ${AvailablePropertyStatus.join(', ')}`,
            ),

        // ---------- PROPERTY TYPE ----------
        query('type')
            .optional()
            .isIn(AvailablePropertyTypes)
            .withMessage(
                `Property type must be one of: ${AvailablePropertyTypes.join(', ')}`,
            ),

        // ---------- ISSUES ----------
        query('issue')
            .optional()
            .isIn(AvailableIssueTypes)
            .withMessage(
                `Issue type must be one of: ${AvailableIssueTypes.join(', ')}`,
            ),

        // ---------- TENANT NAME ----------
        query('tenantName')
            .optional()
            .isString()
            .withMessage('Tenant name must be a string'),

        // ---------- RENT RANGE ----------
        query('minPriceRange')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('minPriceRange must be a positive number'),

        query('maxPriceRange')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('maxPriceRange must be a positive number'),
    ];
};

export {
    propertyDataValidator,
    issuesDataValidator,
    filterPropertiesValidator,
};
