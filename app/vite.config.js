import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({base:'./',plugins:[viteSingleFile(),{name:'embedded-portraits',closeBundle:async()=>{const {rm}=await import('node:fs/promises');await rm(new URL('../dist/retratos',import.meta.url),{recursive:true,force:true})}}],build:{outDir:'../dist',emptyOutDir:true}});
