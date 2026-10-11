import {test,expect} from 'vitest';
import {chooseBatch} from './ranking';
test('similar listing titles occupy one slot while different styles remain visible',()=>{
 const base={store:'Amazon' as const,title:'Women Cotton Printed Kurta',url:'https://www.amazon.in/dp/B000000001',price:400,colour:'blue',fabric:'cotton',observedAt:1};
 const options=chooseBatch([base,{...base,url:'https://www.amazon.in/dp/B000000002',price:450},{...base,url:'https://www.amazon.in/dp/B000000003',title:'Women Cotton Striped Kurta',price:500}],{category:'kurta',budget:1000},{prefer:[],avoid:[]});
 expect(options).toHaveLength(2);expect(options[0].url).toBe(base.url);expect(options[1].title).toContain('Striped');
});
