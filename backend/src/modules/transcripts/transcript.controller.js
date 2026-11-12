const transcriptService = require('./transcript.service');

class TranscriptController {
  async getTranscript(req, res, next) {
    try {
      const { videoId } = req.params;
      const result = await transcriptService.getOrFetchTranscript(videoId);

      if (result.status === 'transcript_unavailable') {
        return res.status(200).json({
          success: false,
          status: 'transcript_unavailable',
          message: result.message,
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        status: 'completed',
        data: result.transcript,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitTranscript(req, res, next) {
    try {
      const { videoId } = req.params;
      const { text, srt, language } = req.body;

      if (!text && !srt) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Either "text" or "srt" content must be provided',
        });
      }

      const result = await transcriptService.submitUserTranscript(videoId, {
        text,
        srt,
        language,
      });

      res.status(201).json({
        success: true,
        message: 'Transcript processed and normalized successfully',
        data: result.transcript,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TranscriptController();

