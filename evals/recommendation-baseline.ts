// Invented frozen catalogue, deliberately independent of live store availability.
import type {Option,Requirements} from '../convex/discoveryRules';
export const baselinePool:Option[]=[
 {title:'Men Navy Cotton Crew Neck T-Shirt',url:'https://www.snitch.com/men-t-shirts/navy-crew/101/buy',store:'SNITCH',price:749,colour:'navy',fabric:'cotton',attributes:['regular fit'],observedAt:1},
 {title:'Men Navy Cotton Large Graphic T-Shirt',url:'https://www.bonkerscorner.com/products/navy-graphic',store:'Bonkers Corner',price:799,colour:'navy',fabric:'cotton',attributes:['large graphic'],observedAt:1},
 {title:'Men Navy Cotton T-Shirt',url:'https://www.snitch.com/men-t-shirts/navy-costly/102/buy',store:'SNITCH',price:1400,colour:'navy',fabric:'cotton',observedAt:1},
 {title:'Men Red Cotton T-Shirt',url:'https://www.snitch.com/men-t-shirts/red-crew/103/buy',store:'SNITCH',price:699,colour:'red',fabric:'cotton',observedAt:1},
];
export const baselineRequest:Requirements={category:'t-shirt',audience:'men',colour:'navy',budget:900,size:'M',occasion:'everyday'};
export const journeyCases=[
 {id:'new-shopper',request:'Navy T-shirt for everyday use under 900, size M, men',expectedRoute:'discover'},
 {id:'returning-new-category',request:'Shoes for a weekend city trip, something bold this time',expectedRoute:'discover'},
 {id:'owned-plus-shopping',request:'Dinner outfit with my navy trousers. A top under 1800 if needed',expectedRoute:'mixed'},
 {id:'gift-refinement',request:'The second one, less shiny, for my brother',expectedRoute:'discover'},
];

// Fixed requests for live relevance checks; sizes/budgets are test assumptions.
export const relevanceCases=[
 {id:'relevance-white',request:'White T-shirts for everyday wear, men size M, under 2000 rupees, any brand. Search now without more questions.'},
 {id:'relevance-bags',request:'Blue bags for college, men, under 2000 rupees, any brand. Search now without more questions.'},
 {id:'relevance-nike',request:'Nike sneakers, men UK 8, under 10000 rupees, any colour. Search now without more questions.'},
 {id:'relevance-purple',request:'Purple sneakers, men UK 8, under 10000 rupees, any brand. Search now without more questions.'},
];
