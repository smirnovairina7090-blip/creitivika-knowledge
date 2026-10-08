import { z } from 'zod';
import { categories, roles, priorities, articleStatuses, requestStatuses } from './knowledge';
const category=z.string().refine(v=>categories.some(c=>c.id===v),'Выберите категорию');
const text=(max=4000)=>z.string().trim().max(max,'Слишком длинный текст');
const required=(max=4000)=>text(max).min(1,'Заполните обязательное поле');
const oneOf=(values:string[])=>z.string().refine(v=>values.includes(v),'Выберите значение из списка');
const steps=z.array(required()).max(20);
export const articleSchema=z.object({
  id:z.string().regex(/^(kb-\d{2}|[0-9a-f-]{36})$/),title:required(200),category,
  summary:text(600),signal:required(),teacher:steps,handoff:text(8000),manager:steps,parent:text(12000),
  followup:text(),escalation:text(),owner:oneOf(roles),priority:oneOf(priorities),
  resources:z.array(z.string().max(100)).max(20),caution:text(),
  author:text(200).default(''),keywords:z.array(text(100)).max(30).default([]),
  managerQuestions:steps.default([]),decisions:z.array(z.object({when:required(1000),action:required(2000)})).max(10).default([]),
  followupMessage:text(12000).default(''),noReplyMessage:text(12000).default(''),
  status:oneOf(articleStatuses),revision:z.number().int().min(0).optional(),updatedAt:text(100).optional(),
}).superRefine((a,ctx)=>{
  if(['Рекомендация','Согласовано'].includes(a.status)){
    for(const [key,label] of [['teacher','Действия преподавателя'],['manager','Действия менеджера'],['handoff','Что передать менеджеру'],['parent','Первое сообщение родителю'],['followup','Проверка результата']] as const){
      if(!a[key].length)ctx.addIssue({code:'custom',path:[key],message:'Для публикации заполните поле '+label});
    }
  }
});
export const fieldLabels:Record<string,string>={title:'Название ситуации',signal:'Как распознать',teacher:'Действия преподавателя',manager:'Действия менеджера',handoff:'Что передать менеджеру',parent:'Сообщение родителю',followup:'Проверка результата',details:'Что произошло',question:'Какой ответ нужен',assignee:'Имя ответственного',dueDate:'Дата ответа',author:'Автор карточки'};
export function validationMessage(issue:{message:string;path:(string|number)[]},labels=fieldLabels){const label=labels[String(issue.path[0])];if(issue.path[0]==='decisions'&&issue.message==='Заполните обязательное поле')return 'Варианты решения: после знака | добавьте конкретное действие.';return label&&issue.message==='Заполните обязательное поле'?label+': добавьте текст.':issue.message;}
export const requestSchema=z.object({
  title:required(200),category,role:oneOf(roles),group:text(300),details:required(8000),
  tried:text(4000),question:required(4000),owner:oneOf(roles),assignee:text(200).default(''),
  dueDate:z.union([z.literal(''),z.string().regex(/^\d{4}-\d{2}-\d{2}$/,'Укажите дату ответа').refine(v=>{const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v},'Укажите существующую дату')]).default(''),priority:oneOf(priorities),
  status:oneOf(requestStatuses),answer:text(12000),
}).superRefine((v,ctx)=>{
  if(v.status==='Готово'&&!v.answer)ctx.addIssue({code:'custom',message:'Для завершения добавьте ответ и результат проверки',path:['answer']});
  if((v.status!=='Новое'||v.answer)&&!v.assignee)ctx.addIssue({code:'custom',message:'Укажите имя сотрудника, который отвечает преподавателю',path:['assignee']});
  if(['В работе','Ждём ответ'].includes(v.status)&&!v.dueDate)ctx.addIssue({code:'custom',message:'Укажите дату следующего ответа',path:['dueDate']});
});
export const questionId=z.string().uuid();
export const questionToken=z.string().regex(/^[0-9a-f]{64}$/);
export const publicQuestionValue=z.object({author:required(120),title:required(200),category,group:text(300).default(''),details:required(8000),tried:text(4000).default(''),question:required(4000)});
export const publicQuestionSchema=z.object({id:questionId,token:questionToken,value:publicQuestionValue,website:z.literal('').default('')});
export const questionMessageSchema=z.object({id:questionId,text:required(4000)});
