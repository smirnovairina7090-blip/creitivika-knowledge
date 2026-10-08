'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Copy, CheckCircle2, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { categories, resources, resourceGroups, type Category } from '@/lib/knowledge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
export function Choice({value,onChange,items,label}:{value:string;onChange:(v:string)=>void;items:{value:string;label:string}[];label:string}){
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="choice"><SelectValue /></SelectTrigger><SelectContent position="popper">{items.map(i=><SelectItem value={i.value} key={i.value}>{i.label}</SelectItem>)}</SelectContent></Select>;
}
export function CategoryTag({id}:{id:Category}){const c=categories.find(c=>c.id===id)!;return <span className="category-tag" style={{color:c.color,background:c.color+'12'}}><span style={{background:c.color}}/>{c.name}</span>;}
export function CopyBlock({title,text}:{title:string;text:string}){
  const [done,setDone]=useState(false);const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current)},[]);
  useEffect(()=>setDone(false),[text]);
  async function copy(){try{if(navigator.clipboard)await navigator.clipboard.writeText(text);else{const node=document.createElement('textarea');node.value=text;node.style.position='fixed';node.style.opacity='0';document.body.appendChild(node);node.select();const ok=document.execCommand('copy');node.remove();if(!ok)throw new Error('copy');}setDone(true);toast.success('Текст скопирован');if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>setDone(false),1800)}catch{toast.error('Не удалось скопировать. Выделите текст вручную.')}}
  return <section className="copy-block"><div className="section-line"><h3>{title}</h3><Button variant="outline" size="sm" onClick={copy} aria-label={'Копировать: '+title}>{done?<Check size={15}/>:<Copy size={15}/>} {done?'Скопировано':'Копировать'}</Button></div><p className="copy-text">{text||'Методист пока не добавил текст.'}</p></section>;
}
export function Steps({steps}:{steps:string[]}){return <ol className="steps">{steps.map((s,i)=><li key={i}><span className="step-number">{i+1}</span><p>{s}</p></li>)}</ol>;}
export function ResourceCard({id,compact=false}:{id:string;compact?:boolean}){
  const [done,setDone]=useState(false);const r=resources.find(r=>r.id===id);if(!r)return null;
  const group=resourceGroups.find(g=>g.id===r.group)!;
  async function copy(){if(!r)return;const text=r.name+' · '+r.time+'\n'+r.cost+'\nПодготовка: '+r.setup+'\n'+r.task+'\nПроверка: '+r.outcome+(!['movement','creative'].includes(r.group)?'\nДомашняя практика - по желанию.':'')+(r.url?'\n'+r.url:'');try{if(navigator.clipboard)await navigator.clipboard.writeText(text);else{const n=document.createElement('textarea');n.value=text;document.body.appendChild(n);n.select();const ok=document.execCommand('copy');n.remove();if(!ok)throw new Error()}setDone(true);toast.success('Упражнение и ссылка скопированы')}catch{toast.error('Не удалось скопировать. Выделите текст вручную.')}}
  return <article className={'resource-card '+(compact?'compact':'')} style={{'--resource-color':group.color} as React.CSSProperties}><span className="resource-type" style={{color:group.color}}>{r.type}</span><h3>{r.name}</h3><div className="resource-meta"><span><Clock size={14}/>{r.time}</span><span>{r.level}</span><span>{r.access==='Аккаунт для сохранения'?'Без входа; аккаунт для сохранения':r.access}</span></div><h4>{['movement','creative'].includes(r.group)?'Как провести':'Короткое упражнение'}</h4><p>{r.task}</p><div className="resource-outcome"><CheckCircle2 size={17}/><p><strong>Проверка результата</strong>{r.outcome}</p></div><div className="resource-actions">{r.url?<a className="resource-link" aria-label={'Открыть '+r.name} href={r.url} target="_blank" rel="noopener noreferrer">Открыть <ExternalLink size={15}/></a>:null}<Button size="sm" variant="ghost" onClick={copy} aria-label={'Скопировать упражнение: '+r.name}>{done?<Check size={15}/>:<Copy size={15}/>} {done?'Скопировано':'Упражнение и ссылка'}</Button></div><Accordion type="single" collapsible className="resource-conditions"><AccordionItem value="conditions"><AccordionTrigger aria-label={'Подготовка и условия: '+r.name}>Подготовка и условия</AccordionTrigger><AccordionContent><p><strong>{r.cost}</strong></p><p>{r.device} · {r.setup}</p><p className="resource-limit">{r.limits}</p><div className="resource-check">{r.source?<><span>Проверено {r.checked}</span><a href={r.source} target="_blank" rel="noopener noreferrer">Официальная страница</a></>:<span>Сценарий преподавателя · {r.checked}</span>}</div></AccordionContent></AccordionItem></Accordion></article>;
}
