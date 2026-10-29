import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {productEdits} from './shared/productEdits.js';

// Give every post real HTML (including social previews), without copying layouts.
const template=readFileSync(new URL('./edits/template.html',import.meta.url),'utf8');
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const editEntries=Object.fromEntries(productEdits.map(post=>{
 const directory=new URL(`./edits/${post.slug}/`,import.meta.url);
 mkdirSync(directory,{recursive:true});
 const values={title:post.title,path:post.path,description:post.description,image:post.products[0].image};
 const file=new URL('index.html',directory);
 writeFileSync(file,template.replace(/\{\{(title|path|description|image)\}\}/g,(_,key)=>escapeHtml(values[key])));
 return [`edit-${post.slug}`,fileURLToPath(file)];
}));

export default defineConfig({
  build: {
    rolldownOptions: {
      input: {
        ...editEntries,
        roadmap: fileURLToPath(new URL("./roadmap/index.html", import.meta.url)),
        faq: fileURLToPath(new URL("./faq/index.html", import.meta.url)),
        pricing: fileURLToPath(new URL("./pricing/index.html", import.meta.url)),
        account: fileURLToPath(new URL("./app/index.html", import.meta.url)),
        website: fileURLToPath(new URL("./index.html", import.meta.url)),
        demo: fileURLToPath(new URL("./demo/index.html", import.meta.url)),
      },
    },
  },
});
