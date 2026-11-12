const integrationsRoutes = require('./integrations.routes');
const integrationsService = require('./integrations.service');
const integrationsController = require('./integrations.controller');
const youTubeService = require('./youtube/youtube.service');
const webSubService = require('./youtube/websub.service');
const webSubRoutes = require('./youtube/websub.routes');

module.exports = {
  integrationsRoutes,
  integrationsService,
  integrationsController,
  youTubeService,
  webSubService,
  webSubRoutes,
};
