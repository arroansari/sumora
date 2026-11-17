/**
 * Comprehensive 11-Section Video Summarization Prompts for Sumora.
 * Grounded in transcript evidence, factual accuracy, and detailed analytical depth.
 */

const SYSTEM_INSTRUCTION = `You are Sumora's premier AI video understanding engine.
Your purpose is to produce an exhaustive, highly accurate, and deeply insightful distillation of a video based strictly on its authentic transcript.

CORE PRINCIPLES & CONSTRAINTS:
1. FACTUAL GROUNDING & ZERO HALLUCINATION:
   - Summarize ONLY information explicitly contained in or directly supported by the transcript.
   - Never invent facts, statistics, historical dates, names, or quotes.
   - If a detail is missing, ambiguous, or unconfirmed in the transcript, state the uncertainty explicitly.
2. STRICT EPISTEMIC CLASSIFICATION:
   - Clearly distinguish between:
     a) Established Facts (independently verifiable historical/technical realities).
     b) Speaker Claims (arguments or assertions made by the creator).
     c) Allegations & Accusations (unproven claims against people or entities).
     d) Opinions & Interpretations (subjective assessments or value judgments).
     e) Unverified / Disputed Information.
   - Never present an allegation or speaker opinion as an established fact.
3. PRONUNCIATION & TERMINOLOGY INTEGRITY:
   - Identify difficult words, personal names, foreign terms, technical terminology, and companies.
   - Provide intuitive, readable phonetic transcriptions (e.g., "JEN-sən HWANG", "HUN-ee-trap").
   - Include IPA notation when confident (e.g., "/ˈdʒɛnsən hwɑːŋ/").
   - Define each term's simple meaning and how it specifically connects to the video narrative.
4. QUOTATION FIDELITY:
   - Mark statements as direct quotes (isDirectQuote: true) ONLY if they reflect the verbatim transcript.
   - If paraphrasing the speaker's argument, set isDirectQuote: false. Never invent direct quotes.
5. CHRONOLOGICAL FIDELITY:
   - Follow the chronological sequence of the video and provide real timestamp markers [MM:SS] matching transcript segments.
6. CONDITIONAL SECTIONS & TOPIC ADAPTATION:
   - For educational, technical, scientific, tutorial, or fun videos, do NOT invent allegations or accusations; return empty arrays [].
   - If the video is longer than 30 minutes, restrict analysis strictly to the first 30:00.
7. MULTILINGUAL TRANSLATION:
   - If the transcript is in Hindi, Hinglish, Spanish, Marathi, or another language, translate and distill the analytical substance into natural, crystal-clear, articulate English.
8. STRUCTURED JSON:
   - Always output valid JSON strictly matching the specified schema.`;

/**
 * Builds user prompt for single-pass comprehensive summarization.
 */
function buildSinglePassPrompt({ title, channelName, description, duration, transcriptText, videoUrl }) {
  return `Perform an in-depth, rigorous, structured distillation of the following video transcript.

VIDEO METADATA:
- Title: ${title || 'Unknown Title'}
- Channel / Creator: ${channelName || 'Unknown Creator'}
- Duration: ${duration || 'N/A'}
- URL: ${videoUrl || 'N/A'}
${description ? `- Creator Description: ${description.slice(0, 400)}` : ''}

TRANSCRIPT:
"""
${transcriptText}
"""

OUTPUT FORMAT:
Respond with a single JSON object strictly matching this schema:
{
  "videoOverview": {
    "title": "${title || ''}",
    "channel": "${channelName || ''}",
    "duration": "${duration || ''}",
    "mainSubject": "Core subject or central controversy/topic in 1 sentence",
    "mainPurpose": "Primary objective of the creator (investigation, commentary, tutorial, review)",
    "whatViewerLearns": "A substantive paragraph explaining what the viewer will understand after reading this distillation"
  },
  "backgroundAndContext": {
    "whyDiscussed": "Why this topic emerged right now or triggered coverage",
    "precedingEvents": "What happened prior to the events in this video",
    "keyEntities": ["List of core organizations, companies, or groups involved"],
    "historicalOrTechnicalContext": "Relevant background that someone unfamiliar with the subject needs to know",
    "whyItMatters": "The broader systemic, geopolitical, technical, or societal significance"
  },
  "detailedBreakdown": [
    {
      "timestampRange": "MM:SS - MM:SS",
      "topic": "Concise section topic title",
      "explanation": "Detailed explanation of what the speaker actually discusses and reveals in this specific section",
      "developments": "Crucial developments, steps, or narrative progression",
      "keyFigures": ["Names of people or organizations highlighted"],
      "evidenceOrNumbers": "Specific data points, dates, leaks, filings, or quotes introduced",
      "significance": "Why this specific section matters to the overall story"
    }
  ],
  "actualEventsAndClaims": {
    "establishedFacts": [
      "Independently verified reality or confirmed event stated in the video"
    ],
    "speakerClaims": [
      "Specific assertion or thesis advanced by the creator"
    ],
    "allegationsAndAccusations": [
      "Specific allegations or accusations raised (clearly identified as such)"
    ],
    "opinionsAndInterpretations": [
      "Speaker's subjective commentary, editorial stance, or prediction"
    ],
    "unverifiedOrDisputed": [
      "Information explicitly acknowledged as unconfirmed, disputed, or developing"
    ]
  },
  "peopleAndOrganizations": [
    {
      "name": "Full Name or Organization Name",
      "role": "Their role or position (e.g. CEO of Nvidia, Chinese tech conglomerate)",
      "context": "Context in which they are discussed in the video",
      "connection": "How they connect to the central issue or controversy"
    }
  ],
  "pronunciationGuide": [
    {
      "term": "Difficult name, company, or technical term",
      "readablePhonetic": "Intuitive English pronunciation (e.g. JEN-sən HWANG)",
      "ipa": "Standard IPA if known, else approximate",
      "meaning": "Clear, concise definition of what this word or entity means",
      "contextInVideo": "How it is applied or why it appears in this video"
    }
  ],
  "importantStatements": [
    {
      "statement": "The notable statement or argument",
      "isDirectQuote": false,
      "context": "When and why this statement was made",
      "significance": "Why this statement is pivotal to the discussion"
    }
  ],
  "examplesAndConnections": [
    {
      "example": "Real-world incident, parallel, or analogy cited",
      "explanation": "What happened in the example",
      "purpose": "Why the speaker used this example to illustrate their point"
    }
  ],
  "finalConclusion": {
    "bottomLine": "The creator's definitive takeaway or conclusion",
    "supportingArguments": [
      "Main argument 1 supporting the conclusion",
      "Main argument 2 supporting the conclusion"
    ],
    "unansweredQuestions": "What remains uncertain, unresolved, or open for future development"
  },
  "keyTakeaways": [
    "Substantive, high-value takeaway 1 (detailed, not generic)",
    "Substantive, high-value takeaway 2",
    "Substantive, high-value takeaway 3",
    "Substantive, high-value takeaway 4",
    "Substantive, high-value takeaway 5"
  ],
  "importantTimestamps": [
    {
      "timestamp": "MM:SS",
      "label": "Topic milestone title",
      "seconds": 0
    }
  ],
  "overview": "A rich 2-3 paragraph executive summary synthesizing the whole video for quick reading",
  "keyPoints": [
    "Quick highlight 1",
    "Quick highlight 2",
    "Quick highlight 3"
  ],
  "importantConcepts": [
    {
      "concept": "Concept or Theme Name",
      "explanation": "Clear explanation of how it operates in the context of this video"
    }
  ],
  "detailedSummary": "A comprehensive prose narrative synthesizing the entire story chronologically with clear headings",
  "conclusion": "The bottom-line conclusion in 1-2 punchy sentences",
  "topicsCovered": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "originalVideoUrl": "${videoUrl || ''}"
}`;
}

/**
 * Builds intermediate chunk prompt for map-reduce on long transcripts.
 */
function buildChunkPrompt({ title, channelName, chunkIndex, totalChunks, chunkText, startTimestamp, endTimestamp }) {
  return `This is Part ${chunkIndex} of ${totalChunks} (timeframe: ${startTimestamp || 'N/A'} - ${endTimestamp || 'N/A'}) of a long video transcript for "${title}" by ${channelName}.

TRANSCRIPT SECTION:
"""
${chunkText}
"""

Extract structured analytical notes for this section adhering to this JSON schema:
{
  "sectionIndex": ${chunkIndex},
  "timestampRange": "${startTimestamp || ''} - ${endTimestamp || ''}",
  "topic": "Concise section topic",
  "detailedNotes": "Detailed, factual explanation of all arguments, events, numbers, and developments in this section",
  "keyFigures": ["Names of people or organizations mentioned"],
  "claimsAndAllegations": ["Specific claims, allegations, or facts raised"],
  "terminology": [
    {
      "term": "Name or technical word",
      "phonetic": "Readable phonetic",
      "meaning": "Meaning in this context"
    }
  ],
  "examples": ["Any real-world analogies or examples cited"]
}`;
}

/**
 * Builds consolidation prompt that aggregates all intermediate chunk notes into the complete 11-section schema.
 */
function buildConsolidationPrompt({ title, channelName, duration, combinedChunkSummaries, videoUrl }) {
  return `Below are comprehensive analytical section notes extracted from a complete, long video transcript for "${title}" by ${channelName} (duration: ${duration || 'N/A'}).

Synthesize these section notes into a cohesive, exhaustive, master structured distillation.

INTERMEDIATE SECTION NOTES:
"""
${combinedChunkSummaries}
"""

OUTPUT FORMAT:
Respond with a single JSON object strictly matching this schema:
{
  "videoOverview": {
    "title": "${title || ''}",
    "channel": "${channelName || ''}",
    "duration": "${duration || ''}",
    "mainSubject": "Core subject or central controversy/topic in 1 sentence",
    "mainPurpose": "Primary objective of the creator",
    "whatViewerLearns": "A substantive paragraph explaining what the viewer will understand"
  },
  "backgroundAndContext": {
    "whyDiscussed": "Why this topic emerged right now",
    "precedingEvents": "What happened prior to the video",
    "keyEntities": ["List of core organizations, companies, or groups"],
    "historicalOrTechnicalContext": "Relevant background that someone unfamiliar needs to know",
    "whyItMatters": "The broader systemic or societal significance"
  },
  "detailedBreakdown": [
    {
      "timestampRange": "MM:SS - MM:SS",
      "topic": "Concise section topic title",
      "explanation": "Detailed explanation of what the speaker discusses in this section",
      "developments": "Crucial developments, steps, or narrative progression",
      "keyFigures": ["Names of people or organizations highlighted"],
      "evidenceOrNumbers": "Specific data points, dates, leaks, or quotes",
      "significance": "Why this specific section matters"
    }
  ],
  "actualEventsAndClaims": {
    "establishedFacts": ["Independently verified reality or confirmed event stated in the video"],
    "speakerClaims": ["Specific assertion or thesis advanced by the creator"],
    "allegationsAndAccusations": ["Specific allegations or accusations raised (clearly identified)"],
    "opinionsAndInterpretations": ["Speaker's subjective commentary or editorial stance"],
    "unverifiedOrDisputed": ["Information explicitly acknowledged as unconfirmed or disputed"]
  },
  "peopleAndOrganizations": [
    {
      "name": "Full Name or Organization Name",
      "role": "Their role or position",
      "context": "Context in which they are discussed",
      "connection": "How they connect to the central issue"
    }
  ],
  "pronunciationGuide": [
    {
      "term": "Difficult name, company, or technical term",
      "readablePhonetic": "Intuitive English pronunciation",
      "ipa": "Standard IPA if known",
      "meaning": "Clear, concise definition",
      "contextInVideo": "How it is applied in this video"
    }
  ],
  "importantStatements": [
    {
      "statement": "Notable statement or argument",
      "isDirectQuote": false,
      "context": "When and why this statement was made",
      "significance": "Why this statement is pivotal"
    }
  ],
  "examplesAndConnections": [
    {
      "example": "Real-world incident, parallel, or analogy cited",
      "explanation": "What happened in the example",
      "purpose": "Why the speaker used this example"
    }
  ],
  "finalConclusion": {
    "bottomLine": "Definitive takeaway or conclusion",
    "supportingArguments": ["Argument 1", "Argument 2"],
    "unansweredQuestions": "What remains uncertain or unresolved"
  },
  "keyTakeaways": [
    "Substantive takeaway 1",
    "Substantive takeaway 2",
    "Substantive takeaway 3",
    "Substantive takeaway 4",
    "Substantive takeaway 5"
  ],
  "importantTimestamps": [
    {
      "timestamp": "MM:SS",
      "label": "Topic milestone title",
      "seconds": 0
    }
  ],
  "overview": "A rich 2-3 paragraph executive summary synthesizing the whole video for quick reading",
  "keyPoints": [
    "Quick highlight 1",
    "Quick highlight 2",
    "Quick highlight 3"
  ],
  "importantConcepts": [
    {
      "concept": "Concept or Theme Name",
      "explanation": "Clear explanation"
    }
  ],
  "detailedSummary": "A comprehensive prose narrative synthesizing the entire story chronologically with clear headings",
  "conclusion": "The bottom-line conclusion in 1-2 punchy sentences",
  "topicsCovered": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "originalVideoUrl": "${videoUrl || ''}"
}`;
}

/**
 * Builds user prompt for direct video audio/visual analysis (when native timedtext is restricted).
 */
function buildDirectVideoPrompt({ title, channelName, description, duration, videoUrl }) {
  return `Perform an in-depth, rigorous, structured distillation of the attached video based on its spoken audio dialogue, events, and visual presentation.

VIDEO METADATA:
- Title: ${title || 'Unknown Title'}
- Channel / Creator: ${channelName || 'Unknown Creator'}
- Duration: ${duration || 'N/A'}
- URL: ${videoUrl || 'N/A'}
${description ? `- Creator Description: ${description.slice(0, 400)}` : ''}

INSTRUCTIONS:
1. 30-MINUTE CAP: If the video is longer than 30 minutes, restrict your analysis and summary strictly to the first 30 minutes (00:00 - 30:00). Do not summarize beyond 30:00.
2. ADAPTIVE CONTENT: For educational, technical, scientific, tutorial, lifestyle, or entertainment videos that do NOT involve controversies, scandals, or legal disputes, keep allegationsAndAccusations as an empty array []. Focus strictly on established facts, explanations, and insights.
3. GROUNDING: Listen carefully to the spoken words and arguments in the attached video. Ground every single point and timestamp strictly in the video's actual audio and dialogue. Never invent facts, dates, names, or quotes.

OUTPUT FORMAT:
Respond with a single JSON object strictly matching this schema:
{
  "videoOverview": {
    "title": "${title || ''}",
    "channel": "${channelName || ''}",
    "duration": "${duration || ''}",
    "mainSubject": "Core subject or central controversy/topic in 1 sentence",
    "mainPurpose": "Primary objective of the creator (investigation, commentary, tutorial, review)",
    "whatViewerLearns": "A substantive paragraph explaining what the viewer will understand after reading this distillation"
  },
  "backgroundAndContext": {
    "whyDiscussed": "Why this topic emerged right now or triggered coverage",
    "precedingEvents": "What happened prior to the events in this video",
    "keyEntities": ["List of core organizations, companies, or groups involved"],
    "historicalOrTechnicalContext": "Relevant background that someone unfamiliar with the subject needs to know",
    "whyItMatters": "The broader systemic, geopolitical, technical, or societal significance"
  },
  "detailedBreakdown": [
    {
      "timestampRange": "MM:SS - MM:SS",
      "topic": "Concise section topic title",
      "explanation": "Detailed explanation of what the speaker actually discusses and reveals in this specific section",
      "developments": "Crucial developments, steps, or narrative progression",
      "keyFigures": ["Names of people or organizations highlighted"],
      "evidenceOrNumbers": "Specific data points, dates, leaks, filings, or quotes introduced",
      "significance": "Why this specific section matters to the overall story"
    }
  ],
  "actualEventsAndClaims": {
    "establishedFacts": [
      "Independently verified reality or confirmed event stated in the video"
    ],
    "speakerClaims": [
      "Specific assertion or thesis advanced by the creator"
    ],
    "allegationsAndAccusations": [
      "Specific allegations or accusations raised (clearly identified as such)"
    ],
    "opinionsAndInterpretations": [
      "Speaker's subjective commentary, editorial stance, or prediction"
    ],
    "unverifiedOrDisputed": [
      "Information explicitly acknowledged as unconfirmed, disputed, or developing"
    ]
  },
  "peopleAndOrganizations": [
    {
      "name": "Full Name or Organization Name",
      "role": "Their role or position (e.g. CEO of Nvidia, Chinese tech conglomerate)",
      "context": "Context in which they are discussed in the video",
      "connection": "How they connect to the central issue or controversy"
    }
  ],
  "pronunciationGuide": [
    {
      "term": "Difficult name, company, or technical term",
      "readablePhonetic": "Intuitive English pronunciation (e.g. JEN-sən HWANG)",
      "ipa": "Standard IPA if known, else approximate",
      "meaning": "Clear, concise definition of what this word or entity means",
      "contextInVideo": "How it is applied or why it appears in this video"
    }
  ],
  "importantStatements": [
    {
      "statement": "The notable statement or argument",
      "isDirectQuote": false,
      "context": "When and why this statement was made",
      "significance": "Why this statement is pivotal to the discussion"
    }
  ],
  "examplesAndConnections": [
    {
      "example": "Real-world incident, parallel, or analogy cited",
      "explanation": "What happened in the example",
      "purpose": "Why the speaker used this example to illustrate their point"
    }
  ],
  "finalConclusion": {
    "bottomLine": "The creator's definitive takeaway or conclusion",
    "supportingArguments": [
      "Main argument 1 supporting the conclusion",
      "Main argument 2 supporting the conclusion"
    ],
    "unansweredQuestions": "What remains uncertain, unresolved, or open for future development"
  },
  "keyTakeaways": [
    "Substantive, high-value takeaway 1 (detailed, not generic)",
    "Substantive, high-value takeaway 2",
    "Substantive, high-value takeaway 3",
    "Substantive, high-value takeaway 4",
    "Substantive, high-value takeaway 5"
  ],
  "importantTimestamps": [
    {
      "timestamp": "MM:SS",
      "label": "Topic milestone title",
      "seconds": 0
    }
  ],
  "overview": "A rich 2-3 paragraph executive summary synthesizing the whole video for quick reading",
  "keyPoints": [
    "Quick highlight 1",
    "Quick highlight 2",
    "Quick highlight 3"
  ],
  "importantConcepts": [
    {
      "concept": "Concept or Theme Name",
      "explanation": "Clear explanation"
    }
  ],
  "detailedSummary": "A comprehensive prose narrative synthesizing the entire story chronologically with clear headings",
  "conclusion": "The bottom-line conclusion in 1-2 punchy sentences",
  "topicsCovered": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "originalVideoUrl": "${videoUrl || ''}"
}`;
}

module.exports = {
  SYSTEM_INSTRUCTION,
  buildSinglePassPrompt,
  buildDirectVideoPrompt,
  buildChunkPrompt,
  buildConsolidationPrompt,
};
