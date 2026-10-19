import fs from 'node:fs/promises';
const h=await fs.readFile('reference.html','utf8');
const urls=[...new Set([...h.matchAll(/https:\/\/static\.tildacdn\.net\/[^\s'"<>]+\.(?:png|svg)/g)].map(m=>m[0]))];
const names=['envelope','palace','flower-line','bismillah','arch-frame','rings','small-icon','divider','ornament','flowers','pin','venue','dress-code','map-frame','chandelier','fine-flower','footer-divider'];
const manifest=[];
await Promise.all(urls.map(async(url,i)=>{const name=names[i]+(url.endsWith('.svg')?'.svg':'.png');const res=await fetch(url);if(!res.ok)throw Error(res.status+' '+url);await fs.writeFile('public/assets/'+name,Buffer.from(await res.arrayBuffer()));manifest.push({name,url});console.log(name);}));
const css=await(await fetch('https://static.tildacdn.net/ws/project8424802/tilda-blocks-page146067533.min.css?t=1782128678')).text();
console.log('FONT',css.match(/@font-face[^}]+}/g));
await fs.writeFile('public/assets/sources.json',JSON.stringify(manifest,null,2));
