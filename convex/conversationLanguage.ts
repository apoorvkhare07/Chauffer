export function replyLanguage(text:string,saved?:string):string{
 if(/(?:हिंदी|हिन्दी)\s*में\s*(?:जवाब|उत्तर|बात|बत)/.test(text))return 'hi';
 if(/(?:अंग्रेज़ी|अंग्रेजी|इंग्लिश)\s*में\s*(?:जवाब|उत्तर|बात|बत)/.test(text))return 'en';
 if(/hinglish\s+mein\s+(?:bata|jawab|baat)/i.test(text))return 'hinglish';
 // A chosen reply language wins over code-switching and previous assistant replies.
 const requested=text.match(/\b(?:reply|respond|speak|answer|continue|talk)(?:\s+to me)?\s+(?:only\s+)?(?:in\s+)?(english|hindi|hinglish)\b/i)?.[1]?.toLowerCase();
 if(requested)return {english:'en',hindi:'hi',hinglish:'hinglish'}[requested]!;
 if(saved&&['en','hi','hinglish'].includes(saved))return saved;
 if(/[\u0900-\u097f]/.test(text))return 'hi';
 if(/\b(chahiye|nahi|nahin|liye|dikhao|mujhe|pasand|karo|chaiye|pehen|kapda|batao)\b/i.test(text))return 'hinglish';
 return 'en';
}
