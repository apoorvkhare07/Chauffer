export function replyLanguage(text:string,saved?:string):string{
 // A chosen reply language wins over code-switching and previous assistant replies.
 const requested=text.match(/\b(?:reply|respond|speak|answer|continue|talk)(?:\s+to me)?\s+(?:only\s+)?(?:in\s+)?(english|hindi|hinglish)\b/i)?.[1]?.toLowerCase();
 if(requested)return {english:'en',hindi:'hi',hinglish:'hinglish'}[requested]!;
 if(saved&&['en','hi','hinglish'].includes(saved))return saved;
 if(/[\u0900-\u097f]/.test(text))return 'hi';
 if(/\b(chahiye|nahi|nahin|liye|dikhao|mujhe|pasand|karo|chaiye|pehen|kapda|batao)\b/i.test(text))return 'hinglish';
 return 'en';
}
