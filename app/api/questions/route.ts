import { getRawDb } from '@/db';
import { sameOrigin } from '@/lib/team-access';
import { publicQuestionSchema, validationMessage } from '@/lib/validation';
import { digest, publicRateLimit, questionJson, readQuestion } from '@/lib/questions-server';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  if(!sameOrigin(request))return questionJson({error:'Недопустимый источник запроса.'},403);
  try{
    const raw=await request.text();if(raw.length>25000)return questionJson({error:'Слишком длинный вопрос.'},413);
    const parsed=publicQuestionSchema.safeParse(JSON.parse(raw));if(!parsed.success)return questionJson({error:validationMessage(parsed.error.issues[0])},400);
    const {id,token,value}=parsed.data;const hash=await digest(token);const db=getRawDb();
    const existing=await db.prepare('SELECT a.token_hash FROM requests r LEFT JOIN question_access a ON a.question_id=r.id WHERE r.id=?').bind(id).first<{token_hash:string|null}>();
    if(existing)return existing.token_hash===hash?questionJson({question:await readQuestion(id)},200):questionJson({error:'Не удалось отправить этот вопрос. Начните новый вопрос.'},409);
    const denied=await publicRateLimit(request,'question');if(denied)return denied;
    const now=new Date().toISOString();const body={...value,source:'teacher',role:'Преподаватель',owner:'Методист',assignee:'',dueDate:'',priority:'Обычная',status:'Новое',answer:'',answerBy:'',answerAt:''};
    // Both rows are committed together. A network retry with the same id/key does not create a duplicate.
    await db.batch([
      db.prepare('INSERT INTO requests (id,body,version,created_at,updated_at) VALUES (?,?,1,?,?) ON CONFLICT(id) DO NOTHING').bind(id,JSON.stringify(body),now,now),
      db.prepare('INSERT INTO question_access (question_id,token_hash,created_at) SELECT ?,?,? WHERE EXISTS (SELECT 1 FROM requests WHERE id=? AND body=? AND created_at=?) ON CONFLICT(question_id) DO NOTHING').bind(id,hash,now,id,JSON.stringify(body),now),
    ]);
    const saved=await db.prepare('SELECT token_hash FROM question_access WHERE question_id=?').bind(id).first<{token_hash:string}>();
    if(saved?.token_hash!==hash)return questionJson({error:'Не удалось отправить этот вопрос. Начните новый вопрос.'},409);
    return questionJson({question:await readQuestion(id)},201);
  }catch(error){if(error instanceof SyntaxError)return questionJson({error:'Некорректный запрос.'},400);console.error('Question creation failed',error);return questionJson({error:'Не удалось отправить. Текст сохранён в форме, попробуйте ещё раз.'},503);}
}
