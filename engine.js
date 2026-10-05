export const products = [
 {id:'a1',store:'Amazon',name:'Cotton straight kurta',category:'kurta',color:'blue',fabric:'cotton',sizes:['S','M','L','XL'],price:799,fee:40,delivery:'3 days',returns:'7-day returns',art:'👗'},
 {id:'f1',store:'Flipkart',name:'Printed cotton kurta set',category:'kurta',color:'blue',fabric:'cotton',sizes:['M','L','XL'],price:949,fee:0,delivery:'4 days',returns:'10-day returns',art:'👗'},
 {id:'m1',store:'Meesho',name:'Cotton everyday kurta',category:'kurta',color:'blue',fabric:'cotton',sizes:['S','M','L'],price:549,fee:60,delivery:'5 days',returns:'7-day returns',art:'👗'},
 {id:'a2',store:'Amazon',name:'Relaxed cotton shirt',category:'shirt',color:'white',fabric:'cotton',sizes:['S','M','L'],price:899,fee:0,delivery:'2 days',returns:'7-day returns',art:'👚'},
 {id:'f2',store:'Flipkart',name:'Wide-leg denim jeans',category:'jeans',color:'blue',fabric:'denim',sizes:['S','M','L','XL'],price:1299,fee:0,delivery:'3 days',returns:'10-day returns',art:'👖'},
 {id:'m2',store:'Meesho',name:'Floral midi dress',category:'dress',color:'pink',fabric:'viscose',sizes:['S','M','L'],price:699,fee:50,delivery:'5 days',returns:'7-day returns',art:'👗'},
 {id:'a3',store:'Amazon',name:'Floral midi dress',category:'dress',color:'pink',fabric:'viscose',sizes:['M','L','XL'],price:1099,fee:0,delivery:'3 days',returns:'7-day returns',art:'👗'},
 {id:'m3',store:'Meesho',name:'Printed festive saree',category:'saree',color:'green',fabric:'silk blend',sizes:['Free size'],price:899,fee:50,delivery:'6 days',returns:'7-day returns',art:'🥻'}
];
export function parseRequest(text) {
 const t=text.toLowerCase();
 const category=[['kurta',/kurta|kurti|कुर्त/],['shirt',/shirt|शर्ट/],['jeans',/jeans|जींस/],['dress',/dress|ड्रेस/],['saree',/saree|sari|साड़ी/]].find(([,r])=>r.test(t))?.[0];
 const color=[['blue',/blue|neela|neeli|नील/],['white',/white|safed|सफेद/],['pink',/pink|gulabi|गुलाबी/],['green',/green|hara|hari|हरा|हरी/]].find(([,r])=>r.test(t))?.[0];
 const budget=t.match(/(?:under|below|budget|within|upto|up to|₹|rs\.?|से कम)\s*(\d+)/)?.[1] ?? t.match(/(\d+)\s*(?:rupees|rupaye|रुपये|के अंदर|से कम)/)?.[1];
 const size=t.match(/(?:size|साइज)\s*(xl|s|m|l)\b/i)?.[1]?.toUpperCase();
 return {category,color,budget:budget?Number(budget):undefined,size,fabric:/cotton|कॉटन|सूती/.test(t)?'cotton':undefined};
}
export function search(text,preferences={}) {
 const explicit=parseRequest(text); const filters={...explicit,size:explicit.size??preferences.size};
 const results=products.filter(p=>(!filters.category||p.category===filters.category)&&(!filters.color||p.color===filters.color)&&(!filters.fabric||p.fabric===filters.fabric)&&(!filters.size||p.sizes.includes(filters.size))&&(!filters.budget||p.price+p.fee<=filters.budget)).sort((a,b)=>(a.price+a.fee)-(b.price+b.fee));
 return {filters,results};
}
export function makeOrder(product,size,method) {
 if(!product.sizes.includes(size))throw new Error('Choose an available size.');
 if(!['UPI','Cash on delivery'].includes(method))throw new Error('Choose a payment method.');
 return {id:globalThis.crypto.randomUUID(),product:{...product},size,method,total:product.price+product.fee,status:'Approved in demo',source:'Bot demo'};
}
export function transition(order,action) {
 if(action==='cancel' && order.status==='Approved in demo')return {...order,status:'Cancelled in demo'};
 if(action==='deliver' && order.status==='Approved in demo')return {...order,status:'Delivered in demo'};
 if(action==='return' && order.status==='Delivered in demo')return {...order,status:'Return requested in demo'};
 throw new Error('This action is unavailable for this order.');
}
