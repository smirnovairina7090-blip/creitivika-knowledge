const env = process.env;
const cookieName='kb_team';
const encoder=new TextEncoder();
const value=(key:string)=>String((env as unknown as Record<string,unknown>)[key]||'');
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
function equal(a:string,b:string){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function sign(payload:string){const secret=value('KB_SESSION_SECRET');if(!secret)return '';const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',key,encoder.encode(payload)));}
export function sameOrigin(request:Request){return request.headers.get('sec-fetch-site')!=='cross-site'&&(!request.headers.get('origin')||request.headers.get('origin')===new URL(request.url).origin);}
export async function hasTeamAccess(request:Request){
  const token=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1);
  if(!token||token.length>400)return false;
  const [exp,nonce,sig,...extra]=token.split('.');
  if(extra.length||!exp||!nonce||!sig||!/^\d+$/.test(exp)||Number(exp)<=Date.now()||Number(exp)>Date.now()+43200000)return false;
  const expected=await sign(exp+'.'+nonce);return !!expected&&equal(sig,expected);
}
export async function verifyCode(code:unknown){
  const expected=value('KB_EDITOR_CODE_HASH');
  if(!expected||!value('KB_SESSION_SECRET'))throw new Error('Доступ команды пока не настроен.');
  if(typeof code!=='string'||code.length>128)return false;
  return equal(hex(await crypto.subtle.digest('SHA-256',encoder.encode(code.trim()))),expected);
}
export async function teamCookie(request:Request,clear=false){
  const payload=Date.now()+43200000+'.'+crypto.randomUUID();
  const token=clear?'':payload+'.'+await sign(payload);
  return cookieName+'='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age='+(clear?0:43200)+(new URL(request.url).protocol==='https:'?'; Secure':'');
}
export const noStore={'Cache-Control':'private, no-store'};
