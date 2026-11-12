const webSubService = require('./websub.service');

class WebSubController {
  /**
   * GET /api/webhooks/youtube
   * Responds to Google PubSubHubbub subscription verification challenge.
   */
  verifyWebhook(req, res) {
    const mode = req.query['hub.mode'];
    const topic = req.query['hub.topic'];
    const challenge = req.query['hub.challenge'];
    const leaseSeconds = req.query['hub.lease_seconds'];

    console.log(`[WebSub] Verification request: mode=${mode}, topic=${topic}, lease=${leaseSeconds}`);

    if (mode === 'subscribe' || mode === 'unsubscribe') {
      if (challenge) {
        // Must respond with 200 OK and echo the hub.challenge in the body
        return res.status(200).send(challenge);
      }
    }

    return res.status(400).send('Bad Request: Missing challenge or unsupported mode');
  }

  /**
   * POST /api/webhooks/youtube
   * Receives new video upload notification from Google WebSub hub.
   */
  async handleWebhookNotification(req, res, next) {
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const signature = req.headers['x-hub-signature'];

      const result = await webSubService.handleNotification(rawBody, signature);

      // Return immediate 200 OK to WebSub hub
      res.status(200).json({
        success: true,
        message: 'Notification received and enqueued',
        processed: result.processed,
      });
    } catch (error) {
      console.error('[WebSub] Error handling notification:', error.message);
      if (error.status) {
        return res.status(error.status).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new WebSubController();

