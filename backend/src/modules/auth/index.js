const authRoutes = require('./auth.routes');
const authService = require('./auth.service');
const authController = require('./auth.controller');
const authValidator = require('./auth.validator');

module.exports = {
  authRoutes,
  authService,
  authController,
  authValidator,
};
