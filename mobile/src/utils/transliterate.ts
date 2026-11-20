/**
 * High-performance, zero-token Devanagari to Hinglish (Roman script) transliterator.
 * Uses phonetic mapping with common spoken conversational vocabulary overrides.
 * Runs 100% locally on-device in < 1 millisecond with zero API calls.
 */

const WORD_OVERRIDES: Record<string, string> = {
  // Calendar / Numbers / Measurements
  'जनवरी': 'January',
  'फरवरी': 'February',
  'मार्च': 'March',
  'अप्रैल': 'April',
  'मई': 'May',
  'जून': 'June',
  'जुलाई': 'July',
  'अगस्त': 'August',
  'सितंबर': 'September',
  'अक्टूबर': 'October',
  'नवंबर': 'November',
  'दिसंबर': 'December',
  'कि.मी.': 'km',
  'किमी': 'km',
  'मीटर': 'meter',

  // Common Proper Nouns & English Loanwords
  'इक्वाडोर': 'Ecuador',
  'गैलेपैगोस': 'Galapagos',
  'आइलैंड': 'island',
  'पेसिफिक': 'Pacific',
  'ओशन': 'ocean',
  'सबमरीन': 'submarine',
  'पायलट': 'pilot',
  'साइंटिस्ट': 'scientist',
  'जियोलॉजिस्ट': 'geologist',
  'डॉक्टर': 'doctor',
  'इंडिया': 'India',
  'वीडियो': 'video',
  'यूट्यूब': 'YouTube',
  'इंटरव्यू': 'interview',
  'इलेक्शन': 'election',
  'कमीशन': 'commission',
  'कमिश्नर': 'commissioner',
  'सुप्रीम': 'Supreme',
  'कोर्ट': 'Court',
  'पुलिस': 'police',
  'सरकार': 'sarkar',
  'पार्टी': 'party',
  'नेपाल': 'Nepal',
  'अमेरिका': 'America',

  // Core Conversational Hinglish Vocabulary
  'में': 'mein',
  'हैं': 'hain',
  'है': 'hai',
  'था': 'tha',
  'थी': 'thi',
  'थे': 'the',
  'होगा': 'hoga',
  'होगी': 'hogi',
  'होंगे': 'honge',
  'का': 'ka',
  'की': 'ki',
  'के': 'ke',
  'को': 'ko',
  'से': 'se',
  'ने': 'ne',
  'और': 'aur',
  'भी': 'bhi',
  'तो': 'toh',
  'पास': 'paas',
  'नाम': 'naam',
  'पानी': 'paani',
  'सफेद': 'safed',
  'काले': 'kaale',
  'काला': 'kaala',
  'लाल': 'laal',
  'छोटी': 'chhoti',
  'छोटा': 'chhota',
  'छोटे': 'chhote',
  'बड़ी': 'badi',
  'बड़ा': 'bada',
  'बड़े': 'bade',
  'सी': 'si',
  'सा': 'sa',
  'लोग': 'log',
  'आदमी': 'aadmi',
  'महिला': 'mahila',
  'बच्चे': 'bachhe',
  'तीन': 'teen',
  'दो': 'do',
  'एक': 'ek',
  'चार': 'chaar',
  'पाँच': 'paanch',
  'दस': 'das',
  'यह': 'yeh',
  'वह': 'woh',
  'ये': 'yeh',
  'वे': 'woh',
  'अंदर': 'andar',
  'बाहर': 'baahar',
  'ऊपर': 'upar',
  'नीचे': 'neeche',
  'बीच': 'beech',
  'बीचों-बीच': 'beech-o-beech',
  'उतरती': 'utarti',
  'उतरता': 'utarta',
  'बैठे': 'baithe',
  'बैठा': 'baitha',
  'बैठी': 'baithi',
  'असल': 'asal',
  'समुद्र': 'samundar',
  'गर्म': 'garm',
  'ठंडा': 'thanda',
  'स्थित': 'sthit',
  'करीब': 'kareeb',
  'दूर': 'door',
  'कहा': 'kaha',
  'कहते': 'kehte',
  'कहना': 'kehna',
  'देख': 'dekh',
  'देखा': 'dekha',
  'देखते': 'dekhte',
  'जाता': 'jaata',
  'जाती': 'jaati',
  'जाते': 'jaate',
  'गया': 'gaya',
  'गयी': 'gayi',
  'गए': 'gaye',
  'आया': 'aaya',
  'आयी': 'aayi',
  'आए': 'aaye',
  'रहा': 'raha',
  'रही': 'rahi',
  'रहे': 'rahe',
  'करता': 'karta',
  'करती': 'karti',
  'करते': 'karte',
  'किया': 'kiya',
  'किए': 'kiye',
  'बहुत': 'bahut',
  'ज्यादा': 'zyada',
  'कम': 'kam',
  'अच्छा': 'achha',
  'अच्छी': 'achhi',
  'खराब': 'kharab',
  'लेकिन': 'lekin',
  'मगर': 'magar',
  'क्योंकि': 'kyunki',
  'ताकि': 'taaki',
  'अगर': 'agar',
  'जब': 'jab',
  'तब': 'tab',
  'अब': 'ab',
  'सब': 'sab',
  'कोई': 'koi',
  'कुछ': 'kuch',
  'क्या': 'kya',
  'क्यों': 'kyun',
  'कैसे': 'kaise',
  'कहाँ': 'kahan',
  'कब': 'kab',
};

const VOWELS: Record<string, string> = {
  'अ': 'a',
  'आ': 'aa',
  'इ': 'i',
  'ई': 'ee',
  'उ': 'u',
  'ऊ': 'oo',
  'ऋ': 'ri',
  'ए': 'e',
  'ऐ': 'ai',
  'ओ': 'o',
  'औ': 'au',
  'अं': 'an',
  'अः': 'ah',
};

const MATRAS: Record<string, string> = {
  'ा': 'a',
  'ि': 'i',
  'ी': 'i',
  'ु': 'u',
  'ू': 'u',
  'ृ': 'ri',
  'े': 'e',
  'ै': 'ai',
  'ो': 'o',
  'ौ': 'au',
  'ं': 'n',
  'ँ': 'n',
  'ः': 'h',
  'ॅ': 'e',
  'ॉ': 'o',
};

const CONSONANTS: Record<string, string> = {
  'क': 'k',
  'ख': 'kh',
  'ग': 'g',
  'घ': 'gh',
  'ङ': 'ng',
  'च': 'ch',
  'छ': 'chh',
  'ज': 'j',
  'झ': 'jh',
  'ञ': 'ny',
  'ट': 't',
  'ठ': 'th',
  'ड': 'd',
  'ढ': 'dh',
  'ण': 'n',
  'त': 't',
  'थ': 'th',
  'द': 'd',
  'ध': 'dh',
  'न': 'n',
  'प': 'p',
  'फ': 'f',
  'ब': 'b',
  'भ': 'bh',
  'म': 'm',
  'य': 'y',
  'र': 'r',
  'ल': 'l',
  'व': 'v',
  'श': 'sh',
  'ष': 'sh',
  'स': 's',
  'ह': 'h',
  'क्ष': 'ksh',
  'त्र': 'tr',
  'ज्ञ': 'gya',
  'ड़': 'r',
  'ढ़': 'rh',
  'फ़': 'f',
  'ज़': 'z',
  'क़': 'q',
  'ख़': 'kh',
  'ग़': 'gh',
};

/**
 * Checks if a string contains any Devanagari Hindi characters.
 */
export function isDevanagariText(text?: string): boolean {
  if (!text) return false;
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Transliterates Devanagari Hindi text to clean conversational Hinglish.
 */
export function devanagariToHinglish(text: string): string {
  if (!text || !isDevanagariText(text)) return text;

  const tokens = text.split(/(\s+|[।,!?.:;()"])/);

  return tokens
    .map((token) => {
      const cleanToken = token.trim();
      if (!cleanToken) return token;

      if (WORD_OVERRIDES[cleanToken]) {
        return WORD_OVERRIDES[cleanToken];
      }

      let result = '';
      const chars = Array.from(token);

      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        const next = chars[i + 1];

        if (VOWELS[c]) {
          result += VOWELS[c];
        } else if (CONSONANTS[c]) {
          result += CONSONANTS[c];

          if (next === '्') {
            // Virama: skip next, cancel implicit vowel
            i++;
          } else if (next && MATRAS[next]) {
            // Check for nasalization e.g. में -> mein
            if (next === 'े' && chars[i + 2] === 'ं') {
              result += 'ein';
              i += 2;
            } else if (next === 'ै' && chars[i + 2] === 'ं') {
              result += 'ain';
              i += 2;
            } else {
              result += MATRAS[next];
              i++;
            }
          } else if (next && (CONSONANTS[next] || VOWELS[next])) {
            result += 'a';
          } else {
            // End of word or before punctuation: schwa deletion
          }
        } else if (MATRAS[c]) {
          result += MATRAS[c];
        } else if (c === '।') {
          result += '.';
        } else {
          result += c;
        }
      }

      return result;
    })
    .join('');
}
