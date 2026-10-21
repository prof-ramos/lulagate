import { defineConfig } from 'vite';
import {readFileSync} from 'node:fs';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({base:'./',plugins:[{name:'grayscale-portraits',enforce:'pre',transform(code,id){if(id.endsWith('/data/dataset.json'))return readFileSync(new URL('./.generated/dataset.json',import.meta.url),'utf8');}},viteSingleFile(),{name:'embedded-portraits',closeBundle:async()=>{const {rm}=await import('node:fs/promises');await rm(new URL('../dist/retratos',import.meta.url),{recursive:true,force:true})}}],build:{outDir:'../dist',emptyOutDir:true}});
