// Reviewed editorial evidence, not live popularity, local availability or a compulsory style rule.
// Expire after the review window; no unsourced "latest" trends when the notes lapse.
export const trendReview='2026-10-15';
export const trendExpiry=Date.parse('2026-11-29T00:00:00Z');
export const editorialTrends=[
 {id:'colour-2026',title:'2026 runway colour directions',publisher:'Vogue India',published:'2026-03-15',url:'https://www.vogue.in/content/10-colour-trends-setting-the-tone-in-2026',scope:'2026 runway reporting; not Indian shopping demand',note:'Navy and powder blue feature alongside brighter accents. Butter yellow can be paired with brown, navy or cream. Use a preferred accent rather than replacing an entire wardrobe.'},
 {id:'menswear-fall-2026',title:'Fall 2026 menswear styling directions',publisher:'Vogue',published:'2026-03-25',url:'https://www.vogue.com/article/menswear-trends-at-the-fall-2026-womenswear-collections',scope:'Fall 2026 runway reporting, adapt to the actual occasion and climate',note:'Tailored silhouettes, brown with neutrals, mint with brown or black, and knitwear used as an accent appeared in menswear styling. These are optional directions, not dress-code or body-type rules.'}
];
export function currentTrends(now=Date.now()){return now<trendExpiry?editorialTrends:[];}
