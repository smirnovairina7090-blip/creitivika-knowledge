import { getRawDb } from '@/db';
import { sameOrigin } from '@/lib/team-access';
import { questionMessageSchema, validationMessage } from '@/lib/validation';
import { authorizedQuestion, publicRateLimit, questionJson, readQuestion } from '@/lib/questions-server';
export const dynamic='force-dynamic';
type Context={params:Promise<{id:string}>};
export async function GET(request:Request,context:Context){
  try{const {id}=await context.params;if(!await authorizedQuestion(request,id))return questionJson({error:'Вопрос недоступен. Откройте полную личную ссылку, которую получили после отправки.'},404);return questionJson({question:await readQuestion(id)});}
  catch(error){console.error('Personal question load failed',error);return questionJson({error:'Не удалось загрузить вопрос. Попробуйте ещё раз.'},503);}
}
export async function POST(request:Request,context:Context){
  if(!sameOrigin(request))return questionJson({error:'Недопустимый источник запроса.'},403);
  try{
    const {id}=await context.params;if(!await authorizedQuestion(request,id))return questionJson({error:'Вопрос недоступен. Откройте полную личную ссылку.'},404);
    const raw=await request.text();if(raw.length>10000)return questionJson({error:'Слишком длинное уточнение.'},413);
    const parsed=questionMessageSchema.safeParse(JSON.parse(raw));if(!parsed.success)return questionJson({error:validationMessage(parsed.error.issues[0])},400);
    const db=getRawDb();const duplicate=await db.prepare('SELECT question_id FROM question_messages WHERE id=?').bind(parsed.data.id).first<{question_id:string}>();
    if(duplicate)return duplicate.question_id===id?questionJson({question:await readQuestion(id)}):questionJson({error:'Не удалось отправить уточнение.'},409);
    const denied=await publicRateLimit(request,'message');if(denied)return denied;
    const now=new Date().toISOString();
    await db.batch([
      db.prepare('INSERT INTO question_messages (id,question_id,body,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(parsed.data.id,id,parsed.data.text,now),
      db.prepare("UPDATE requests SET version=version+1,updated_at=?,body=(jsonb_set(body::jsonb,'{status}',to_jsonb(CASE WHEN body::jsonb->>'status' IN ('Готово','Ждём ответ') THEN 'В работе' ELSE body::jsonb->>'status' END)))::text WHERE id=?").bind(now,id),
    ]);
    return questionJson({question:await readQuestion(id)},201);
  }catch(error){if(error instanceof SyntaxError)return questionJson({error:'Некорректный запрос.'},400);console.error('Question clarification failed',error);return questionJson({error:'Не удалось отправить уточнение. Текст остался в форме.'},503);}
}
