import {test,expect,vi,afterEach} from 'vitest';
import {diwaliEdit,defineProductEdits,editForPath,editTryOnHref,selectedEditProduct,curatedProductForUrl} from '../shared/productEdits';
import {readTryOnProduct} from './tryOnProduct';
import {allowedProductUrl,allowedImageUrl} from './discoveryRules';
afterEach(()=>vi.restoreAllMocks());
test('each edit handoff resolves its exact product and safe merchant image',()=>{
 for(const product of diwaliEdit.products){
  const url=new URL(editTryOnHref(product),'https://chauffer.studio');
  expect(url.hash).toBe('#/try-on');
  expect(url.searchParams.get('edit')).toBe('diwali-post-1');
  expect(selectedEditProduct(url.search)).toBe(product);
  expect(allowedProductUrl(product.url)).toBe(true);
  expect(allowedImageUrl(product.imageUrl)).toBe(true);
  expect(new URL(product.url).search).toBe('');
 }
 expect(selectedEditProduct('?edit=diwali&piece=unknown')).toBeNull();
 expect(selectedEditProduct('?edit=other&piece=kurta')).toBeNull();
 expect(curatedProductForUrl(diwaliEdit.products[0].url+'.evil')).toBeNull();
});
test('post slugs resolve independently and cannot share routes or product IDs',()=>{
 expect(editForPath('/edits/diwali-post-1/')).toBe(diwaliEdit);
 expect(editForPath('/edits/diwali-post-1')).toBe(diwaliEdit);
 expect(editForPath('/edits/diwali-post-1/index.html')).toBe(diwaliEdit);
 expect(editForPath('/edits/unknown/')).toBeNull();
 const posts=defineProductEdits([diwaliEdit,{...diwaliEdit,id:'another',slug:'another-post-2',products:diwaliEdit.products.slice(0,2)}]);
 expect(posts.map(post=>post.path)).toEqual(['/edits/diwali-post-1/','/edits/another-post-2/']);
 expect(posts[1].products).toHaveLength(2);
 expect(editTryOnHref(posts[1].products[0])).toContain('edit=another-post-2&');
 expect(posts[1].products[0].editPath).toBe('/edits/another-post-2/');
 expect(()=>defineProductEdits([diwaliEdit,diwaliEdit])).toThrow('unique');
 expect(()=>defineProductEdits([{...diwaliEdit,slug:'../bad'}])).toThrow('slugs');
 expect(()=>defineProductEdits([{...diwaliEdit,products:[]}])).toThrow('products');
 expect(()=>defineProductEdits([{...diwaliEdit,products:[diwaliEdit.products[0],diwaliEdit.products[0]]}])).toThrow('unique IDs');
});
test('curated product links use checked images without any paid page retrieval',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockRejectedValue(new Error('No provider call expected'));
 for(const product of diwaliEdit.products)expect(await readTryOnProduct(product.url)).toEqual({title:product.title,imageUrl:product.imageUrl});
 expect(fetch).not.toHaveBeenCalled();
});
