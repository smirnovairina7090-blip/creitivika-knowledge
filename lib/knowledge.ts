import cases from './case-seed.json';
export type Category = 'skills' | 'pace' | 'behavior' | 'parents' | 'lessons' | 'organization' | 'tech';
export type Article = {
  id: string; title: string; category: Category; summary: string; signal: string;
  teacher: string[]; handoff: string; manager: string[]; parent: string;
  followup: string; escalation: string; owner: string; priority: string;
  resources: string[]; caution: string; author: string; keywords: string[];
  managerQuestions: string[]; decisions: {when: string; action: string}[];
  followupMessage: string; noReplyMessage: string;
  status: string; updatedAt?: string; revision?: number;
};
export type RequestRecord = {
  id: string; title: string; category: Category; role: string; group: string;
  details: string; tried: string; question: string; owner: string; assignee: string;
  dueDate: string; priority: string; status: string; answer: string;
  createdAt: string; updatedAt: string; version: number;
  author?: string; source?: 'teacher' | 'team'; answerBy?: string; answerAt?: string;
  messages?: QuestionMessage[];
};
export type QuestionMessage = {id:string; text:string; createdAt:string; role:'Преподаватель'};
export type PersonalQuestion = Pick<RequestRecord,'id'|'title'|'category'|'group'|'details'|'tried'|'question'|'status'|'answer'|'assignee'|'dueDate'|'createdAt'|'updatedAt'|'version'|'author'|'answerBy'|'answerAt'|'messages'>;
export type QuestionLink = {id:string; token:string; title:string; subscribed:boolean; seenAnswerAt:string};
export const categories: {id:Category; name:string; color:string; short:string}[] = [
  {id:'skills', name:'Компьютерные навыки', short:'Навыки', color:'#1764a4'},
  {id:'pace', name:'Уровень и темп', short:'Уровень', color:'#6953b8'},
  {id:'behavior', name:'Внимание и поведение', short:'Поведение', color:'#bd6330'},
  {id:'parents', name:'Родители и обратная связь', short:'Родители', color:'#267766'},
  {id:'lessons', name:'Урок и материалы', short:'Методика', color:'#a14373'},
  {id:'organization', name:'Расписание и организация', short:'Организация', color:'#516379'},
  {id:'tech', name:'Техника и подключение', short:'Техника', color:'#39757e'},
];
export const roles = ['Преподаватель','Менеджер','Методист','Руководитель'];
export const articleStatuses = ['Черновик','На проверке','Рекомендация','Согласовано','Архив'];
export const requestStatuses = ['Новое','В работе','Ждём ответ','Готово'];
export const priorities = ['Обычная','Внимание','Срочно'];
export const defaultOwner = (category:string) => category==='tech' ? 'Менеджер' : ['skills','pace','lessons'].includes(category) ? 'Методист' : 'Менеджер';

export { resources, resourceGroups } from './resources';
export const seedArticles: Article[] = cases as Article[];
export const publicArticle = (a: Article) => ['Рекомендация','Согласовано'].includes(a.status);
export function cardId(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,v=>v.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);}
export function blankArticle(): Article {return {id:cardId(),title:'',category:'skills',summary:'',signal:'',teacher:[],handoff:'',manager:[],parent:'',followup:'',escalation:'',owner:'Методист',priority:'Обычная',resources:[],caution:'',status:'Черновик',revision:0,author:'',keywords:[],managerQuestions:[],decisions:[],followupMessage:'',noReplyMessage:''};}
export const protocol = [
  {
    "role": "Преподаватель",
    "title": "Факт и первая поддержка",
    "text": "Записывает наблюдаемое действие, проверяет причину на уроке, пробует короткий приём и передаёт менеджеру конкретный запрос. При опасности сразу подключает руководителя."
  },
  {
    "role": "Менеджер",
    "title": "Контакт с семьёй и следующий шаг",
    "text": "Уточняет ощущения и ограничения семьи, согласует конкретное действие, возвращает ответ преподавателю и назначает дату проверки. Организационные вопросы координирует сам."
  },
  {
    "role": "Методист",
    "title": "Уровень, урок и траектория",
    "text": "Подключается при устойчивых трудностях, повторной жалобе, несоответствии уровня или проблеме материалов. Предлагает адаптацию, диагностику или подходящий курс."
  },
  {
    "role": "Руководитель",
    "title": "Безопасность и решения по условиям",
    "text": "Разбирает угрозы безопасности, серьёзные конфликты, финансовые запросы и исключения из действующих правил. Необходимые решения передаёт менеджеру."
  }
];
export const relatedCases:Record<string,string[]>={
  'kb-01':['kb-02','kb-35','kb-44'],'kb-02':['kb-01','kb-05','kb-43'],'kb-03':['kb-02','kb-34','kb-42'],'kb-04':['kb-06','kb-21','kb-45'],
  'kb-05':['kb-37','kb-13','kb-46'],'kb-06':['kb-03','kb-04','kb-52'],'kb-07':['kb-08','kb-12','kb-36'],'kb-08':['kb-21','kb-12','kb-44'],
  'kb-09':['kb-22','kb-45','kb-19'],'kb-10':['kb-04','kb-21','kb-38'],'kb-11':['kb-36','kb-30','kb-07'],'kb-12':['kb-08','kb-26','kb-39'],
  'kb-13':['kb-46','kb-51','kb-37'],'kb-14':['kb-15','kb-39','kb-31'],'kb-15':['kb-14','kb-35','kb-38'],'kb-16':['kb-07','kb-36','kb-17'],
  'kb-17':['kb-16','kb-27','kb-19'],'kb-18':['kb-23','kb-49','kb-48'],'kb-19':['kb-18','kb-26','kb-22'],'kb-20':['kb-02','kb-03','kb-37'],
  'kb-21':['kb-08','kb-05','kb-50'],'kb-22':['kb-03','kb-04','kb-45'],'kb-23':['kb-13','kb-18','kb-37'],'kb-24':['kb-40','kb-44','kb-21'],
  'kb-25':['kb-34','kb-03','kb-26'],'kb-26':['kb-33','kb-47','kb-19'],'kb-27':['kb-17','kb-20','kb-37'],'kb-28':['kb-41','kb-40','kb-47'],
  'kb-29':['kb-19','kb-25','kb-26'],'kb-30':['kb-36','kb-11','kb-10'],'kb-31':['kb-44','kb-24','kb-14'],'kb-32':[],
  'kb-33':['kb-26','kb-34','kb-25'],'kb-34':['kb-25','kb-03','kb-43'],'kb-35':['kb-01','kb-15','kb-14'],'kb-36':['kb-07','kb-11','kb-30'],
  'kb-37':['kb-05','kb-13','kb-46'],'kb-38':['kb-15','kb-39','kb-18'],'kb-39':['kb-14','kb-15','kb-12'],'kb-40':['kb-28','kb-41','kb-24'],
  'kb-41':['kb-28','kb-40','kb-43'],'kb-42':['kb-03','kb-06','kb-26'],'kb-43':['kb-02','kb-05','kb-41'],'kb-44':['kb-03','kb-31','kb-02'],
  'kb-45':['kb-22','kb-04','kb-18'],'kb-46':['kb-13','kb-05','kb-23'],'kb-47':['kb-28','kb-26','kb-08'],'kb-48':['kb-18','kb-04','kb-29'],
  'kb-49':['kb-18','kb-23','kb-31'],'kb-50':['kb-06','kb-36','kb-05'],'kb-51':['kb-13','kb-46','kb-07'],'kb-52':['kb-06','kb-42','kb-26'],
};
