const fcmService = require('./fcm.service');
const preferencesService = require('./preferences.service');
const preferencesController = require('./preferences.controller');
const preferencesRoutes = require('./preferences.routes');
const devicesRoutes = require('./devices.routes');

module.exports = {
  fcmService,
  preferencesService,
  preferencesController,
  preferencesRoutes,
  devicesRoutes,
};
