export function replyLanguage(text:string,saved='en'):string{
 if(/[\u0900-\u097f]/.test(text))return 'hi';
 if(/\b(chahiye|nahi|nahin|liye|dikhao|mujhe|pasand|karo|chaiye|pehen|kapda|batao)\b/i.test(text))return 'hinglish';
 if((text.match(/[a-z]{2,}/gi)??[]).length>=5)return 'en';
 return ['en','hi','hinglish'].includes(saved)?saved:'en';
}
