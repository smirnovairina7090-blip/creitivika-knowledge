import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';
const root = path.resolve(import.meta.dirname, '..');
registerHooks({
  resolve(specifier, context, next) {
    let target;
    if (specifier.startsWith('@/')) target = path.join(root, specifier.slice(2));
    else if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) target = path.resolve(path.dirname(fileURLToPath(context.parentURL)),specifier);
    if (target) {
      for (const candidate of [target,target+'.ts',path.join(target,'index.ts')]) if (existsSync(candidate) && /\.(ts|json)$/.test(candidate)) return {url:pathToFileURL(candidate).href,shortCircuit:true};
    }
    return next(specifier,context);
  },
  load(url,context,next) {
    if (url===pathToFileURL(path.join(root,'db/index.ts')).href) return {format:'module',source:'export function getRawDb(){return globalThis.__testDb}',shortCircuit:true};
    if (url.startsWith('file:') && url.endsWith('.ts')) return {format:'module',source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText,shortCircuit:true};
    if (url.startsWith('file:') && url.endsWith('.json')) return {format:'module',source:'export default '+readFileSync(fileURLToPath(url),'utf8'),shortCircuit:true};
    return next(url,context);
  }
});
const pg = new PGlite();
await pg.exec(readFileSync(path.join(root,'netlify/database/migrations/20261008150000_knowledge.sql'),'utf8'));
const {Database,postgresQuery}=await import('../db/adapter.ts');
const query=async(sql,params)=>{const r=await pg.query(sql,params);return {...r,rowCount:r.affectedRows};};
globalThis.__testDb=new Database({query,connect:async()=>({query,release(){}})});
process.env.KB_SESSION_SECRET='isolated-test-session';
process.env.KB_EDITOR_CODE_HASH=createHash('sha256').update('test-team-code').digest('hex');
const api=await import('../app/api/knowledge/route.ts');
const team=await import('../app/api/team/route.ts');
const create=await import('../app/api/questions/route.ts');
const detail=await import('../app/api/questions/[id]/route.ts');
const origin='https://example.netlify.app';
function request(route,method='GET',body,headers={}){return new Request(origin+route,{method,headers:{origin,'content-type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)});}
let checks=0;
function check(actual,expected){assert.deepEqual(actual,expected);checks++;}
check(postgresQuery("SELECT '?' AS literal WHERE id=?"),"SELECT '?' AS literal WHERE id=$1");
const publicList=await (await api.GET(request('/api/knowledge'))).json();
check(publicList.canEdit,false);assert(publicList.articles.length>30);checks++;
check((await team.POST(request('/api/team','POST',{code:'incorrect'}))).status,401);
const login=await team.POST(request('/api/team','POST',{code:'test-team-code'}));check(login.status,200);
const cookie=login.headers.get('set-cookie').split(';')[0];
const id=crypto.randomUUID(),token='a'.repeat(64);
const submission={id,token,value:{author:'Тестовый преподаватель',title:'Проверка цикла',category:'lessons',group:'Python',details:'Не понимает цикл',tried:'Показали пример',question:'Как объяснить цикл?'}};
const sent=await create.POST(request('/api/questions','POST',submission));check(sent.status,201);
check((await create.POST(request('/api/questions','POST',submission))).status,200);
const context={params:Promise.resolve({id})};
check((await detail.GET(request('/api/questions/'+id),context)).status,404);
check((await detail.GET(request('/api/questions/'+id,'GET',undefined,{'X-Question-Key':'b'.repeat(64)}),context)).status,404);
const personal=await (await detail.GET(request('/api/questions/'+id,'GET',undefined,{'X-Question-Key':token}),context)).json();check(personal.question.author,submission.value.author);
const queue=await (await api.GET(request('/api/knowledge','GET',undefined,{cookie}))).json();check(queue.requests.length,1);
const q=queue.requests[0];
const reply={id,version:q.version,value:{...q,assignee:'Методист',status:'Готово',answer:'Покажите повторение команд на двух шагах.'}};
check((await api.PATCH(request('/api/knowledge','PATCH',reply))).status,401);
const answered=await api.PATCH(request('/api/knowledge','PATCH',reply,{cookie}));check(answered.status,200);
check((await api.PATCH(request('/api/knowledge','PATCH',reply,{cookie}))).status,409);
const ready=await (await detail.GET(request('/api/questions/'+id,'GET',undefined,{'X-Question-Key':token}),context)).json();check(ready.question.answer,reply.value.answer);assert(ready.question.answerAt);checks++;
const clarification={id:crypto.randomUUID(),text:'Какой пример выбрать?'};
check((await detail.POST(request('/api/questions/'+id,'POST',clarification,{'X-Question-Key':token}),context)).status,201);
check((await detail.POST(request('/api/questions/'+id,'POST',clarification,{'X-Question-Key':token}),context)).status,200);
const clarified=await (await detail.GET(request('/api/questions/'+id,'GET',undefined,{'X-Question-Key':token}),context)).json();check(clarified.question.status,'В работе');check(clarified.question.messages.length,1);
check((await create.POST(request('/api/questions','POST',{...submission,id:crypto.randomUUID(),website:'spam'}))).status,400);
check((await create.POST(request('/api/questions','POST',{...submission,id:crypto.randomUUID()},{origin:'https://other.example'}))).status,403);
for(let i=0;i<9;i++)check((await create.POST(request('/api/questions','POST',{...submission,id:crypto.randomUUID()}))).status,201);
check((await create.POST(request('/api/questions','POST',{...submission,id:crypto.randomUUID()}))).status,429);
const logout=await team.DELETE(request('/api/team','DELETE',undefined,{cookie}));check(logout.status,200);
await pg.close();
console.log(checks+' checks passed: public questions, access control, replies, clarifications, PostgreSQL transactions and rate limits.');
