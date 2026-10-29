import {test,expect} from 'vitest';
import {chooseBatch} from './ranking';
test('similar listing titles occupy one slot while different styles remain visible',()=>{
 const base={store:'Amazon' as const,title:'Women Cotton Printed Kurta',url:'https://www.amazon.in/dp/B000000001',price:400,colour:'blue',fabric:'cotton',observedAt:1};
 const options=chooseBatch([base,{...base,url:'https://www.amazon.in/dp/B000000002',price:450},{...base,url:'https://www.amazon.in/dp/B000000003',title:'Women Cotton Striped Kurta',price:500}],{category:'kurta',budget:1000},{prefer:[],avoid:[]});
 expect(options).toHaveLength(2);expect(options[0].url).toBe(base.url);expect(options[1].title).toContain('Striped');
});

test('daily edits can use six distinct options from a readable store',()=>{
 const options=Array.from({length:8},(_,i)=>({store:'Flipkart' as const,title:`Printed Kurta Design ${i}`,url:`https://www.flipkart.com/design/p/${i}`,price:200+i,colour:'blue',fabric:'cotton',observedAt:1}));
 expect(chooseBatch(options,{category:'kurta',budget:1000},{prefer:[],avoid:[]},6)).toHaveLength(6);
 expect(chooseBatch(options,{category:'kurta',budget:1000},{prefer:[],avoid:[]})).toHaveLength(3);
});

test('a matching saved listing with a price drop gets a daily recommendation slot',()=>{
 const base={store:'Flipkart' as const,url:'https://www.flipkart.com/a/p/a',title:'Printed kurta',price:400,colour:'blue',fabric:'cotton',observedAt:1};
 const options=[base,...Array.from({length:8},(_,i)=>({...base,url:`https://www.flipkart.com/new/p/${i}`,title:`Floral printed kurta Design ${i}`,price:200+i}))];
 const batch=chooseBatch(options,{category:'kurta',budget:1000},{prefer:['floral'],avoid:[]},6,[base.url]);
 expect(batch).toHaveLength(6);expect(batch[0].url).toBe(base.url);
});

test('guest pages retain enough distinct matches for twelve at a time without relaxing the budget',()=>{
 const stores=['Amazon','Myntra','Flipkart'] as const;
 const options=stores.flatMap((store,s)=>Array.from({length:10},(_,i)=>({store,title:`Printed Kurta Design ${s}-${i}`,url:`https://www.flipkart.com/design/p/${s}${i}`,price:700+i,colour:'blue',fabric:'cotton',observedAt:1})));
 const pool=chooseBatch([...options,{...options[0],url:'https://www.flipkart.com/design/p/expensive',title:'Expensive Kurta',price:2000}],{category:'kurta',budget:1000},{prefer:[],avoid:[]},10,[],36);
 expect(pool).toHaveLength(30);expect(pool.every(p=>p.price<=1000)).toBe(true);
 expect(new Set(pool.slice(0,12).map(p=>p.store)).size).toBe(3);
 expect(new Set(pool.map(p=>p.url)).size).toBe(30);
 expect(chooseBatch(options,{category:'kurta',budget:1000},{prefer:[],avoid:[]})).toHaveLength(6);
});
