import {readFileSync} from 'node:fs';
const form=new FormData();form.set('file',new Blob([readFileSync(process.argv[3])],{type:'image/png'}),'mage.png');
const response=await fetch(process.argv[2],{method:'POST',body:form});
if(!response.ok)throw Error('Upload HTTP '+response.status);
const result=await response.json();if(!result.ref)throw Error('Missing upload reference');console.log(result.ref);
