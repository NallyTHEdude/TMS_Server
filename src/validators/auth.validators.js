import { body } from 'express-validator';

const userRegisterValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Email is not valid'),

        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required')
            .isLength({ min: 3 })
            .withMessage('Username must be atleast 3 characters'),

        body('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 4 })
            .withMessage('Password must be atleast 4 characters'),

        body('fullName')
            .optional()
            .trim()
            .isLength({ min: 3 })
            .withMessage('Full name must be atleast 3 characters'),
        
        body('role')
            .notEmpty()
            .withMessage('Role is required')
    ];
};

const userLoginValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Email is not valid'),

        body('username')
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ min: 3 })
            .withMessage('Username must be atleast 3 characters'),

        body('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
            .isLength({ min: 4 })
            .withMessage('Password must be atleast 4 characters'),

        body('role')
            .notEmpty()
            .withMessage('Role is required')
    ];
};


const userChangeCurrentPasswordValidator = () => {
    return [
        body('oldPassword').notEmpty().withMessage('Old password is required'),

        body('newPassword').notEmpty().withMessage('New password is required'),
    ];
};

const userForgotPasswordValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Email is not valid'),
    ];
};

const userResetPasswordValidator = () => {
    return [
        body('newPassword').notEmpty().withMessage('New password is required'),
    ];
};

export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetPasswordValidator,
};
