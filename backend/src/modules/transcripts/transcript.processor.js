/**
 * Decodes standard HTML entities commonly found in caption files.
 * @param {string} text
 * @returns {string}
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}

/**
 * Cleans individual caption text lines:
 * - Decodes HTML entities
 * - Strips sound effect markers like [Music], [Applause], (laughter), ♪
 * - Collapses redundant whitespace
 * @param {string} rawText
 * @returns {string}
 */
function cleanSegmentText(rawText) {
  if (!rawText) return '';
  let cleaned = decodeHtmlEntities(rawText);

  // Remove bracketed cues, audio tags, musical symbols
  cleaned = cleaned.replace(/\[(?:music|applause|laughter|cheering|silence|crosstalk|screaming|groan|groaning)\]/gi, '');
  cleaned = cleaned.replace(/\((?:music|applause|laughter|cheering)\)/gi, '');
  cleaned = cleaned.replace(/[♪♫#]/g, '');

  // Replace newlines and excessive whitespace with a single space
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Normalizes raw segments into the standard format and produces fullText.
 * @param {object} params
 * @param {string} params.videoId
 * @param {string} params.language
 * @param {string} params.source
 * @param {Array<{start: number|string, duration: number|string, text: string}>} params.rawSegments
 * @returns {{videoId: string, language: string, source: string, segments: Array<{start: number, duration: number, text: string}>, fullText: string, status: string}}
 */
function normalizeTranscript({ videoId, language = 'en', source, rawSegments }) {
  const normalizedSegments = [];
  const textPieces = [];

  for (const raw of rawSegments) {
    const cleanedText = cleanSegmentText(raw.text);
    if (!cleanedText) {
      continue; // Skip empty segments (e.g. segments that only had [Music])
    }

    const start = Math.max(0, Math.round(parseFloat(raw.start || 0) * 100) / 100);
    const duration = Math.max(0, Math.round(parseFloat(raw.duration || 0) * 100) / 100);

    normalizedSegments.push({
      start,
      duration,
      text: cleanedText,
    });

    textPieces.push(cleanedText);
  }

  const fullText = textPieces.join(' ').replace(/\s+/g, ' ').trim();

  return {
    videoId,
    language: language.toLowerCase().slice(0, 5),
    source,
    segments: normalizedSegments,
    fullText,
    status: 'completed',
  };
}

module.exports = {
  cleanSegmentText,
  decodeHtmlEntities,
  normalizeTranscript,
};

