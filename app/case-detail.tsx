'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Star, Pencil, Link2, AlertCircle, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from '@/components/ui/sheet';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { type Article } from '@/lib/knowledge';
import { CategoryTag, CopyBlock, Steps, ResourceCard } from './knowledge-parts';
type Props={article:Article|undefined;onClose:()=>void;role:string;onRole:(v:string)=>void;favorite:boolean;onFavorite:()=>void;onEdit:()=>void;onQuestion:()=>void;related:Article[];onOpen:(id:string)=>void;canEdit:boolean};
export function CaseDetail({article:a,onClose,role,onRole,favorite,onFavorite,onEdit,onQuestion,related,onOpen,canEdit}:Props){
  const bodyRef=useRef<HTMLDivElement>(null);
  const [parent,setParent]=useState('');const [child,setChild]=useState('');const [date,setDate]=useState('');const [message,setMessage]=useState('first');
  useEffect(()=>{setParent('');setChild('');setDate('');setMessage('first');bodyRef.current?.scrollTo({top:0});},[a?.id]);
  const personalize=(text:string)=>text.replaceAll('[имя родителя]',parent.trim()||'[имя родителя]').replaceAll('[имя ребёнка]',child.trim()||'[имя ребёнка]').replaceAll('[имя]',child.trim()||'[имя]').replaceAll('[Имя]',child.trim()||'[Имя]').replaceAll('[дата]',date.trim()||'[дата]');
  async function share(){try{await navigator.clipboard.writeText(window.location.origin+'/#article='+a?.id);toast.success('Ссылка на ситуацию скопирована')}catch{toast.error('Скопируйте адрес из строки браузера.')}}
  return <Sheet open={!!a} onOpenChange={open=>{if(!open)onClose()}}><SheetContent className="case-sheet" showCloseButton={false}>{a?<>
    <SheetHeader className="case-sheet-header"><div className="section-line"><CategoryTag id={a.category}/><SheetClose asChild><Button variant="ghost" size="icon" aria-label="Закрыть ситуацию"><X size={22}/></Button></SheetClose></div><SheetTitle>{a.title}</SheetTitle><SheetDescription>{a.summary||a.signal}</SheetDescription><div className="case-meta"><span className={'article-status '+(a.status==='Согласовано'?'approved':'')}>{a.status}</span><span>Координирует: {a.owner}</span>{a.priority==='Срочно'?<span className="urgent">Срочно</span>:null}</div><div className="detail-actions"><Button size="sm" variant="outline" onClick={onFavorite} aria-pressed={favorite}><Star size={16} fill={favorite?'currentColor':'none'}/>{favorite?'В избранном':'Запомнить'}</Button><Button size="sm" variant="outline" onClick={share}><Link2 size={16}/>Ссылка</Button>{canEdit?<Button size="sm" variant="outline" onClick={onEdit}><Pencil size={16}/>Изменить</Button>:null}<Button size="sm" variant="ghost" onClick={onQuestion}><MessageSquare size={16}/>Уточнить у методиста</Button></div></SheetHeader>
    <div className="case-sheet-body" ref={bodyRef}><section><h3>Как распознать</h3><p>{a.signal}</p></section>
      <Tabs value={role} onValueChange={onRole} className="detail-tabs"><TabsList aria-label="Действия по роли"><TabsTrigger value="teacher">Преподавателю</TabsTrigger><TabsTrigger value="manager">Менеджеру</TabsTrigger></TabsList>
      <TabsContent value="teacher"><h3>Что сделать на уроке</h3>{a.teacher.length?<Steps steps={a.teacher}/>:<p>Методист дополняет порядок действий.</p>}<CopyBlock title="Передать менеджеру" text={a.handoff}/></TabsContent>
      <TabsContent value="manager">
        {a.managerQuestions.length?<section><h3>Сначала уточните</h3><ul className="question-list">{a.managerQuestions.map(q=><li key={q}>{q}</li>)}</ul></section>:null}
        {a.decisions.length?<section><h3>Выберите следующий шаг</h3><div className="decision-list">{a.decisions.map((d,i)=><div key={i}><strong>{d.when}</strong><p>{d.action}</p></div>)}</div></section>:null}
        <section className="message-panel"><h3>Готовые сообщения семье</h3><details className="personalizer"><summary>Подставить имя и дату</summary><div className="personalizer-fields"><label>Имя родителя<Input value={parent} onChange={e=>setParent(e.target.value)} placeholder="Например: Анна" autoComplete="off"/></label><label>Имя ребёнка<Input value={child} onChange={e=>setChild(e.target.value)} placeholder="Например: Артём" autoComplete="off"/></label><label>Дата проверки<Input value={date} onChange={e=>setDate(e.target.value)} placeholder="Например: 15 октября" autoComplete="off"/></label></div><p>Имена используются только для подготовки текста и не сохраняются.</p></details>
          <Tabs value={message} onValueChange={setMessage} className="message-tabs"><TabsList aria-label="Этап сообщения"><TabsTrigger value="first">Первое</TabsTrigger><TabsTrigger value="check">После проверки</TabsTrigger><TabsTrigger value="remind">Нет ответа</TabsTrigger></TabsList><TabsContent value="first"><CopyBlock title="Первое сообщение" text={personalize(a.parent)}/></TabsContent><TabsContent value="check"><CopyBlock title="Обратная связь" text={personalize(a.followupMessage)}/></TabsContent><TabsContent value="remind"><CopyBlock title="Мягкое напоминание" text={personalize(a.noReplyMessage)}/></TabsContent></Tabs>
          <p className="template-note">Перед отправкой замените оставшиеся поля в квадратных скобках конкретными наблюдениями и договорённостями.</p>
        </section>
        <Accordion type="single" collapsible className="manager-protocol"><AccordionItem value="steps"><AccordionTrigger>Полный порядок работы менеджера</AccordionTrigger><AccordionContent><Steps steps={a.manager}/></AccordionContent></AccordionItem></Accordion>
      </TabsContent></Tabs>
      {a.followup?<section className="followup-panel"><h3>Как проверить результат</h3><p>{a.followup}</p></section>:null}{a.escalation?<section className="escalation-panel"><h3>Когда подключить коллег</h3><p>{a.escalation}</p></section>:null}{a.caution?<p className="caution"><AlertCircle size={18}/><span>{a.caution}</span></p>:null}
      {a.resources.length?<section><h3>Подходящие упражнения</h3><div className="compact-resources">{a.resources.map(id=><ResourceCard key={id} id={id} compact/>)}</div></section>:null}
      {related.length?<section className="related-cases"><h3>Похожие ситуации</h3>{related.map(r=><button key={r.id} onClick={()=>onOpen(r.id)}>{r.title}<span>Открыть</span></button>)}</section>:null}
      <p className="card-credit">{a.author?'Карточка: '+a.author:'Карточка методического отдела'}{a.updatedAt?' · Обновлено '+new Date(a.updatedAt).toLocaleDateString('ru-RU'):''}</p>
    </div>
  </>:null}</SheetContent></Sheet>;
}
