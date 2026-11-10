// Evaluate trusted project modules for offline art catalogues without starting
// a dev server or depending on browser globals. Uses the installed TS compiler.
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const nativeRequire=createRequire(import.meta.url),cache=new Map();
export function loadProjectTs(file){
 file=resolve(file);if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 if(extname(file)==='.json'){module.exports=JSON.parse(readFileSync(file,'utf8'));return module.exports;}
 const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const require=id=>{if(!id.startsWith('.'))return nativeRequire(id);const base=resolve(dirname(file),id),target=[base,base+'.ts',base+'.json'].find(p=>existsSync(p)&&extname(p));if(!target)throw Error('Missing project module '+id);return loadProjectTs(target);};
 new Function('require','module','exports',source)(require,module,module.exports);
 return module.exports;
}
