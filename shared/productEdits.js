// Curated post content. Prices belong to the post, not a live inventory feed.
const posts = [{
 id: 'diwali', slug: 'diwali-post-1', title: 'The Diwali edit',
 kicker: 'THE FESTIVE FINDS · 01', heading: 'Your Diwali look,', accent: 'all linked up.',
 description: 'Loved the Diwali look? Find every piece from our post, shop the links, and see a piece on you with Chauffer try-on.',
 products: [
  {id:'kurta',brand:'Libas',name:'The mustard kurta',description:'Embroidered silk-blend straight kurta',price:789,
   url:'https://www.myntra.com/kurtas/libas/libas-mustard-embroidered-silk-blend-straight-kurta/45009447/buy',
   imageUrl:'https://assets.myntassets.com/h_1440,q_75,w_1080/v1/assets/images/2026/AUGUST/11/grJ2CLOZ_9aff31d238764042ad5dcc9d98e4c85b.jpg'},
  {id:'palazzo',brand:'Globus',name:'The ivory palazzos',description:'Flared palazzos with a floral lace hem',price:725,
   url:'https://www.myntra.com/palazzos/globus/globus-women-solid-ivory-floral-lace-hem-flared-ethnic-palazzos/22206230/buy',
   imageUrl:'https://assets.myntassets.com/h_1440,q_75,w_1080/v1/assets/images/22206230/2023/8/31/166fea58-687c-4b13-88f7-e819d4d69bee1693459960838-Globus-Women-Flared-Ethnic-Palazzos-3141693459960148-1.jpg'},
  {id:'dupatta',brand:'Muffly',name:'The maroon dupatta',description:'Banarasi woven dupatta with zari',price:546,
   url:'https://www.myntra.com/dupatta/muffly/muffly-ethnic-motifs-woven-design-banarasi-dupatta-with-zari/25757002/buy',
   imageUrl:'https://assets.myntassets.com/h_1440,q_75,w_1080/v1/assets/images/25757002/2023/11/4/a727aa0e-28a7-4a4a-a02e-9d6dde7d85881699039397597MufflyWovenDesignBanarasiDupattaChunniLength-25mtrsWidth-45i1.jpg'},
  {id:'jhumkas',brand:'Zaveri Pearls',name:'The gold-toned jhumkas',description:'Contemporary jhumka earrings',price:328,
   url:'https://www.myntra.com/earrings/zaveri+pearls/zaveri-pearls-gold-toned-contemporary-jhumkas-earrings/19804762/buy',
   imageUrl:'https://assets.myntassets.com/h_1440,q_75,w_1080/v1/assets/images/19804762/2022/9/7/f0559380-7235-4489-ba83-0e2a42025fd21662535074323ZaveriPearlsGold-TonedContemporaryJhumkasEarrings1.jpg'},
 ].map(product=>({...product,title:`${product.brand} · ${product.description}`,image:`/images/edits/diwali/${product.id}.webp`,store:'Myntra'})),
}];
// Every post owns its slug, copy and product list. Build creates its HTML page.
/** @param {typeof posts} records */
export function defineProductEdits(records){
 const slugs=new Set();
 return records.map(post=>{
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug)||slugs.has(post.slug))throw new Error('Post slugs must be unique, lowercase words separated by hyphens.');
  slugs.add(post.slug);
  if(!post.products.length||new Set(post.products.map(p=>p.id)).size!==post.products.length)throw new Error('Each post needs products with unique IDs.');
  const path=`/edits/${post.slug}/`;
  return {...post,path,products:post.products.map(product=>({...product,editSlug:post.slug,editTitle:post.title,editPath:path}))};
 });
}
export const productEdits=defineProductEdits(posts);
export const diwaliEdit=productEdits[0];
export function editForPath(path=''){
 const slug=path.match(/^\/edits\/([a-z0-9-]+)(?:\/index\.html|\/)?$/)?.[1];
 return productEdits.find(post=>post.slug===slug)??null;
}
export function editTryOnHref(product){return `/app/?edit=${encodeURIComponent(product.editSlug)}&piece=${encodeURIComponent(product.id)}#/try-on`;}
export function selectedEditProduct(search=''){
 const params=new URLSearchParams(search),post=productEdits.find(post=>post.slug===params.get('edit')||post.id===params.get('edit'));
 return post?.products.find(product=>product.id===params.get('piece'))??null;
}
export function curatedProductForUrl(url){return productEdits.flatMap(post=>post.products).find(product=>product.url===url)??null;}
