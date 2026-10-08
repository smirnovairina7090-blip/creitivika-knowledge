import { hasTeamAccess, sameOrigin } from '@/lib/team-access';
import { getRawDb } from '@/db';
import { seedArticles, publicArticle, type Article, type RequestRecord, type QuestionMessage } from '@/lib/knowledge';
import { articleSchema, requestSchema, validationMessage } from '@/lib/validation';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
async function auth(request:Request){
  if(!sameOrigin(request))return json({error:'Недопустимый источник запроса.'},403);
  if(!await hasTeamAccess(request))return json({error:'Для сохранения откройте доступ команды по коду.'},401);
  return null;
}
export async function GET(request:Request){
  const canEdit=await hasTeamAccess(request);
  try{
    const db=getRawDb();
    const [saved,queue,messages]=await Promise.all([
      db.prepare('SELECT id,body,revision,updated_at FROM articles').all<{id:string;body:string;revision:number;updated_at:string}>(),
      canEdit?db.prepare('SELECT id,body,version,created_at,updated_at FROM requests ORDER BY created_at DESC').all<{id:string;body:string;version:number;created_at:string;updated_at:string}>():Promise.resolve({results:[]}),
      canEdit?db.prepare('SELECT id,question_id,body,created_at FROM question_messages ORDER BY created_at,id').all<{id:string;question_id:string;body:string;created_at:string}>():Promise.resolve({results:[]}),
    ]);
    const merged=new Map<string,Article>(seedArticles.map(a=>[a.id,{...a,revision:0}]));
    for(const r of saved.results){const body=JSON.parse(r.body);const normalized={...merged.get(r.id),...body,revision:r.revision,updatedAt:r.updated_at};const parsed=articleSchema.safeParse(normalized);if(parsed.success)merged.set(r.id,parsed.data as Article);}
    const byQuestion=new Map<string,QuestionMessage[]>();
    for(const m of messages.results){const list=byQuestion.get(m.question_id)||[];list.push({id:m.id,text:m.body,createdAt:m.created_at,role:'Преподаватель'});byQuestion.set(m.question_id,list);}
    const requests=queue.results.map(r=>({...JSON.parse(r.body),id:r.id,version:r.version,createdAt:r.created_at,updatedAt:r.updated_at,messages:byQuestion.get(r.id)||[]})) as RequestRecord[];
    return json({articles:[...merged.values()].filter(a=>canEdit||publicArticle(a)),requests,canEdit});
  }catch(error){console.error('Knowledge load failed',error);return json({error:'Не удалось загрузить сохранённые данные. Обновите страницу или попробуйте позже.'},503);}
}
export async function POST(request:Request){
  const denied=await auth(request);if(denied)return denied;
  try{
    if(Number(request.headers.get('content-length')||0)>150000)return json({error:'Слишком большой запрос.'},413);
    const input=await request.json() as {kind:string;value:unknown};
    const db=getRawDb();const now=new Date().toISOString();
    if(input.kind==='article'){
      const parsed=articleSchema.safeParse(input.value);if(!parsed.success)return json({error:validationMessage(parsed.error.issues[0])},400);
      const a=parsed.data;const revision=a.revision||0;
      const write=await db.prepare('INSERT INTO articles (id,body,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(id) DO UPDATE SET body=excluded.body,revision=articles.revision+1,updated_at=excluded.updated_at WHERE articles.revision=?').bind(a.id,JSON.stringify(a),now,revision).run();
      if(write.meta.changes===0)return json({error:'Карточка уже изменена в другой вкладке. Обновите данные перед сохранением.'},409);
      const saved=await db.prepare('SELECT revision,updated_at FROM articles WHERE id=?').bind(a.id).first<{revision:number;updated_at:string}>();
      return json({article:{...a,revision:saved!.revision,updatedAt:saved!.updated_at}});
    }
    if(input.kind==='request'){
      const parsed=requestSchema.safeParse(input.value);if(!parsed.success)return json({error:validationMessage(parsed.error.issues[0])},400);
      const id=crypto.randomUUID();const body={...parsed.data,source:'team',author:'',answerBy:parsed.data.answer?parsed.data.assignee:'',answerAt:parsed.data.answer?now:''};const record={...body,id,createdAt:now,updatedAt:now,version:1};
      await db.prepare('INSERT INTO requests (id,body,version,created_at,updated_at) VALUES (?,?,1,?,?)').bind(id,JSON.stringify(body),now,now).run();
      return json({request:record},201);
    }
    return json({error:'Неизвестное действие.'},400);
  }catch(error){if(error instanceof SyntaxError)return json({error:'Некорректный запрос.'},400);console.error('Knowledge save failed',error);return json({error:'Не удалось сохранить. Текст остался в форме, попробуйте ещё раз.'},503);}
}
export async function PATCH(request:Request){
  const denied=await auth(request);if(denied)return denied;
  try{
    if(Number(request.headers.get('content-length')||0)>150000)return json({error:'Слишком большой запрос.'},413);
    const input=await request.json() as {id:string;version:number;value:unknown};
    if(!/^[0-9a-f-]{36}$/.test(input.id)||!Number.isInteger(input.version))return json({error:'Некорректный идентификатор.'},400);
    const parsed=requestSchema.safeParse(input.value);if(!parsed.success)return json({error:validationMessage(parsed.error.issues[0])},400);
    const db=getRawDb();const now=new Date().toISOString();
    const previous=await db.prepare('SELECT body FROM requests WHERE id=?').bind(input.id).first<{body:string}>();
    if(!previous)return json({error:'Обращение недоступно.'},404);
    const old=JSON.parse(previous.body) as RequestRecord;
    const answerChanged=old.answer!==parsed.data.answer||(parsed.data.status==='Готово'&&old.status!=='Готово');
    const body={...parsed.data,source:old.source||'team',author:old.author||'',answerBy:parsed.data.answer?(answerChanged?parsed.data.assignee:old.answerBy||parsed.data.assignee):'',answerAt:parsed.data.answer?(answerChanged?now:old.answerAt||now):''};
    const write=await db.prepare('UPDATE requests SET body=?,version=version+1,updated_at=? WHERE id=? AND version=?').bind(JSON.stringify(body),now,input.id,input.version).run();
    if(!write.meta.changes)return json({error:'Обращение уже изменено или недоступно. Обновите данные перед сохранением.'},409);
    const saved=await db.prepare('SELECT version,created_at FROM requests WHERE id=?').bind(input.id).first<{version:number;created_at:string}>();
    const messages=await db.prepare('SELECT id,body,created_at FROM question_messages WHERE question_id=? ORDER BY created_at,id').bind(input.id).all<{id:string;body:string;created_at:string}>();
    return json({request:{...body,id:input.id,version:saved!.version,createdAt:saved!.created_at,updatedAt:now,messages:messages.results.map(m=>({id:m.id,text:m.body,createdAt:m.created_at,role:'Преподаватель'}))}});
  }catch(error){console.error('Request update failed',error);return json({error:'Не удалось сохранить. Текст остался в форме, попробуйте ещё раз.'},503);}
}
