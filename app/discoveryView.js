import {validSize,sizeKind} from '../convex/fashionRules';
export function refinementSuggestions(r,question){
 if(question?.choices?.length)return [...question.choices.map(c=>c.label),'No preference, show options'];
 if(!r.category)return r.audience==='men'?["Casual shirts","Everyday T-shirts","Sneakers","Bags"]:r.audience==='women'?["Everyday kurtas","Casual shirts","Sneakers","Bags"]:['Shirts','Kurtas','Sneakers','Bags'];
 if(!r.budget)return ['Under ₹500','Under ₹1,000','Under ₹2,000'];
 if(!validSize(r.category,r.size))return sizeKind(r.category)==='shoe'?['UK 6','UK 8','EU 42']:sizeKind(r.category)==='waist'?['Waist 30 inches','Waist 32 inches','Size M']:['Size S','Size M','Size L','Size XL'];
 return r.pricePreference==='lowest_price'?['Best within budget','Show more options','Lower budget']:['Show more options','Cheapest options','Lower budget'];
}
export function currentTurnReplies(messages){return messages.slice(messages.findLastIndex(m=>m.role==='user')+1).filter(m=>m.role==='assistant');}
