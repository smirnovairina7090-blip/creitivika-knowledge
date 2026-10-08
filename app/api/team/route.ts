import { sameOrigin, verifyCode, teamCookie, noStore } from '@/lib/team-access';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Недопустимый источник запроса.'},{status:403,headers:noStore});
  if(!request.headers.get('content-type')?.startsWith('application/json'))return Response.json({error:'Некорректный запрос.'},{status:400,headers:noStore});
  try{
    const raw=await request.text();if(raw.length>512)return Response.json({error:'Слишком длинный код.'},{status:400,headers:noStore});
    const {code}=JSON.parse(raw);
    if(!await verifyCode(code))return Response.json({error:'Код не подошёл. Проверьте его у руководителя.'},{status:401,headers:noStore});
    return Response.json({canEdit:true},{headers:{...noStore,'Set-Cookie':await teamCookie(request)}});
  }catch(e){return Response.json({error:e instanceof SyntaxError?'Некорректный запрос.':'Доступ команды пока не настроен.'},{status:503,headers:noStore});}
}
export async function DELETE(request:Request){
  if(!sameOrigin(request))return Response.json({error:'Недопустимый источник запроса.'},{status:403,headers:noStore});
  return Response.json({canEdit:false},{headers:{...noStore,'Set-Cookie':await teamCookie(request,true)}});
}
