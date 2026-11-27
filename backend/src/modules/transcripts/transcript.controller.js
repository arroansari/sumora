const transcriptService = require('./transcript.service');
const prisma = require('../../config/db');
const inlinePipeline = require('../pipeline/inline-pipeline.service');

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

      // Automatically trigger summarization now that transcript is persisted
      const video = await prisma.video.findUnique({ where: { videoId } });
      if (video) {
        inlinePipeline.fireAndForget({
          videoId,
          channelId: video.channelId,
          title: video.title,
          videoUrl: video.videoUrl,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Transcript processed and normalized successfully. Summarization initiated.',
        data: result.transcript,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Non-blocking transcript warm-up before user taps "Read Summary".
   */
  async prefetchTranscript(req, res) {
    const { videoId } = req.params;
    setImmediate(() => {
      transcriptService.getOrFetchTranscript(videoId).catch(() => {});
    });
    res.status(202).json({
      success: true,
      status: 'prefetching',
      videoId,
    });
  }
}

module.exports = new TranscriptController();

