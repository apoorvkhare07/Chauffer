import {test,expect} from 'vitest';
import {refinementSuggestions,currentTurnReplies} from '../app/discoveryView';
test('the buttons answer the actual question and both acknowledgement and result stay visible',()=>{
 const question={question:'Nike or Puma?',choices:[{label:'Nike'},{label:'Puma'}]};
 expect(refinementSuggestions({category:'sneakers',budget:4000,size:'UK 8'},question)).toEqual(['Nike','Puma','No preference, show options']);
 const messages=[{role:'user',text:'sneakers under 3000'},{role:'assistant',text:'Old result'},{role:'user',text:'Nike, can go to 4000'},{role:'assistant',text:'Updated budget to ₹4,000 and brand to Nike.'},{role:'assistant',text:'Here are 6 options.'}];
 expect(currentTurnReplies(messages).map((m:{text:string})=>m.text)).toEqual(['Updated budget to ₹4,000 and brand to Nike.','Here are 6 options.']);
});
