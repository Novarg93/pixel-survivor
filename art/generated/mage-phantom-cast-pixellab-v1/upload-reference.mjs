import {readFileSync} from 'node:fs';
const form=new FormData();
form.set('file',new Blob([readFileSync('art/generated/mage-phantom-cast-pixellab-v1/reference/mage-south.png')],{type:'image/png'}),'mage-south.png');
const response=await fetch(process.argv[2],{method:'POST',body:form});
if(!response.ok)throw Error('Reference upload HTTP '+response.status);
const result=await response.json();if(!result.ref)throw Error('No uploaded reference');
console.log(result.ref);
