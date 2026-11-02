import {createServer} from '../../../Papermotion/node_modules/vite/dist/node/index.js';import path from 'node:path';import os from 'node:os';import {fileURLToPath} from 'node:url';
try{os.setPriority(0,os.constants.priority.PRIORITY_BELOW_NORMAL)}catch{}
const root=path.dirname(fileURLToPath(import.meta.url));
const server=await createServer({root,configFile:false,cacheDir:path.join(root,'.cache/vite'),server:{host:'127.0.0.1',port:3311,strictPort:true,hmr:false,watch:{ignored:['**/assets/**','**/review/**','**/.cache/**']},fs:{allow:['S:/AI_Tools']}},logLevel:'error'});
await server.listen();console.log('عائلة دودو: http://localhost:3311');
