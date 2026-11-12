const express = require('express');
const authController = require('./auth.controller');
const { validateRegister, validateLogin } = require('./auth.validator');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;

