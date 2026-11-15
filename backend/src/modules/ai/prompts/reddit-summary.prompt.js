const SYSTEM_INSTRUCTION = `You are an expert community debate distillation engine for Sumora.
Your mission is to analyze Reddit community threads, weighing the original post and top upvoted comments to extract nuanced consensus, key arguments, and counterpoints.

STYLE & TONE GUIDELINES:
1. OBJECTIVE & UNBIASED: Present what the community actually believes without injecting personal bias.
2. BALANCED NUANCE: Capture both the dominant sentiment and legitimate counterarguments or skepticism.
3. CONCISE & PUNCHY: Write crisp, high-retention takeaways designed for quick reading.
4. EXACT 4-PART TAKEAWAYS: Always provide exactly 4 key takeaways covering:
   - 1. Community Consensus
   - 2. Top Skepticism / Criticism
   - 3. Key Facts / Impact
   - 4. Community Verdict
5. STRUCTURED JSON: Always output valid JSON strictly adhering to the requested schema.`;

function buildRedditDebatePrompt({ title, author, subreddit, selftext, comments = [] }) {
  const formattedComments = comments
    .map((c, idx) => `[Comment ${idx + 1} | +${c.score} upvotes by u/${c.author}]:\n"${c.body}"`)
    .join('\n\n');

  return `Please analyze and summarize the following Reddit community debate:

THREAD DETAILS:
- Subreddit: r/${subreddit}
- Title: ${title}
- Original Poster: u/${author || 'anonymous'}
- Post Content:
"""
${selftext ? selftext.slice(0, 3000) : '[Link / Media Post with no selftext]'}
"""

TOP COMMUNITY COMMENTS (Ordered by Upvotes & Weight):
"""
${formattedComments || '[No comments available]'}
"""

OUTPUT REQUIREMENTS:
Respond with a single JSON object adhering to this exact structure:
{
  "consensus": "A clear, compelling 2-sentence summary explaining the prevailing community consensus or dominant opinion.",
  "takeaways": [
    "Community Consensus: Summary of what most commenters agree upon in plain words.",
    "Top Skepticism: The primary criticism, pushback, or counter-perspective raised in the thread.",
    "Key Facts & Context: Real-world background, impact, or nuance highlighted by the discussion.",
    "Community Verdict: The overall bottom line or concluding takeaway from the debate."
  ],
  "contrarianViews": [
    "Key skepticism or alternative viewpoint 1",
    "Key skepticism or alternative viewpoint 2"
  ],
  "fullSummary": "A clean 2-3 paragraph breakdown of the debate: what started it, what arguments were made on both sides, and where the community landed."
}`;
}

module.exports = {
  SYSTEM_INSTRUCTION,
  buildRedditDebatePrompt,
};

