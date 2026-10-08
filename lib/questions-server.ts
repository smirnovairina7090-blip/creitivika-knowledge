import { getRawDb } from '@/db';
import { sameOrigin } from '@/lib/team-access';
import type { PersonalQuestion, QuestionMessage, RequestRecord } from '@/lib/knowledge';
import { questionId, questionToken } from '@/lib/validation';
const env = process.env;
export const questionJson=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export async function readQuestion(id:string):Promise<PersonalQuestion|null>{
  const db=getRawDb();const row=await db.prepare('SELECT id,body,version,created_at,updated_at FROM requests WHERE id=?').bind(id).first<{id:string;body:string;version:number;created_at:string;updated_at:string}>();
  if(!row)return null;
  const r=JSON.parse(row.body) as RequestRecord;
  const messages=await db.prepare('SELECT id,body,created_at FROM question_messages WHERE question_id=? ORDER BY created_at,id').bind(id).all<{id:string;body:string;created_at:string}>();
  return {id,title:r.title,category:r.category,author:r.author||'',group:r.group,details:r.details,tried:r.tried,question:r.question,status:r.status,answer:r.answer,assignee:r.assignee,dueDate:r.dueDate,answerBy:r.answerBy||'',answerAt:r.answerAt||'',createdAt:row.created_at,updatedAt:row.updated_at,version:row.version,messages:messages.results.map(m=>({id:m.id,text:m.body,createdAt:m.created_at,role:'Преподаватель'} as QuestionMessage))};
}
export async function authorizedQuestion(request:Request,id:string){
  const token=request.headers.get('X-Question-Key')||'';
  if(!questionId.safeParse(id).success||!questionToken.safeParse(token).success)return false;
  const row=await getRawDb().prepare('SELECT token_hash FROM question_access WHERE question_id=?').bind(id).first<{token_hash:string}>();
  return !!row&&row.token_hash===await digest(token);
}
export async function publicRateLimit(request:Request,kind:'question'|'message'){
  if(!sameOrigin(request))return questionJson({error:'Недопустимый источник запроса.'},403);
  const now=new Date();const secret=(env as unknown as Record<string,string>).KB_SESSION_SECRET||'local-preview';
  const ipHash=await digest(secret+':'+(request.headers.get('x-nf-client-connection-ip')||'unknown'));
  const bucket=kind+':'+now.toISOString().slice(0,13)+':'+ipHash;
  const db=getRawDb();const count=await db.prepare('INSERT INTO question_limits (bucket,count,updated_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=question_limits.count+1 RETURNING count').bind(bucket,now.toISOString()).first<{count:number}>();
  await db.prepare('DELETE FROM question_limits WHERE updated_at<?').bind(new Date(now.getTime()-86400000).toISOString()).run();
  if((count?.count||0)>(kind==='question'?10:30))return questionJson({error:'Слишком много отправок подряд. Попробуйте позже; уже отправленные вопросы доступны по личной ссылке.'},429);
  return null;
}
