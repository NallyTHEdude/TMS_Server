import { body } from 'express-validator';

const userUpdateValidator = () => {
    return [
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required')
            .isLength({ min: 3, max: 30 })
            .withMessage('Username must be between 3-30 characters')
            .matches(/^[a-z0-9_]+$/)
            .withMessage(
                'Username can only contain lowercase letters, numbers, and underscores',
            ),
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail(),
        body('fullName')
            .trim()
            .notEmpty()
            .withMessage('Full name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Full name must be between 2-50 characters'),
    ];
};

const userDeleteAccountValidator = () => {
    return [
        body('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required to delete your account'),
    ];
};

export { userUpdateValidator, userDeleteAccountValidator };
