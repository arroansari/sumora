const HTML_ENTITY_MAP = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};
const HTML_ENTITY_RE = /&(?:amp|lt|gt|quot|apos|#39|#x([0-9a-fA-F]+)|#(\d+));/g;
const CUE_AND_SYMBOL_RE = /\[(?:music|applause|laughter|cheering|silence|crosstalk|screaming|groan|groaning)\]|\((?:music|applause|laughter|cheering)\)|[♪♫#]/gi;

/**
 * Decodes standard HTML entities commonly found in caption files in a single regex pass.
 * @param {string} text
 * @returns {string}
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  if (!text.includes('&')) return text;
  return text.replace(HTML_ENTITY_RE, (match, hex, dec) => {
    if (hex) return String.fromCharCode(parseInt(hex, 16));
    if (dec) return String.fromCharCode(parseInt(dec, 10));
    return HTML_ENTITY_MAP[match] || match;
  });
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
  const decoded = decodeHtmlEntities(rawText);
  return decoded
    .replace(CUE_AND_SYMBOL_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
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
    if (start > 1800) {
      break; // Cap processing to first 30 minutes per constraint
    }
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

