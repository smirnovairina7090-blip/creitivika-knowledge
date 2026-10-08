'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PersonalQuestion, QuestionLink } from './knowledge';
const storageKey='creitivika.my-questions.v1';
export function validLink(x:unknown):x is QuestionLink {if(!x||typeof x!=='object')return false;const q=x as QuestionLink;return /^[0-9a-f-]{36}$/.test(q.id)&&/^[0-9a-f]{64}$/.test(q.token)&&typeof q.title==='string'&&typeof q.subscribed==='boolean'&&typeof q.seenAnswerAt==='string';}
export const personalUrl=(q:Pick<QuestionLink,'id'|'token'>)=>window.location.origin+'/#question='+q.id+'&key='+q.token;
export async function readPersonalQuestion(q:Pick<QuestionLink,'id'|'token'>,signal?:AbortSignal){
  const r=await fetch('/api/questions/'+q.id,{cache:'no-store',headers:{'X-Question-Key':q.token},signal});
  const d=await r.json() as {error?:string;question:PersonalQuestion};if(!r.ok||!d.question)throw new Error(d.error||'Не удалось загрузить вопрос.');return d.question;
}
export function useQuestions(){
  const [links,setLinks]=useState<QuestionLink[]>([]);const [data,setData]=useState<Record<string,PersonalQuestion>>({});
  const [errors,setErrors]=useState<Record<string,string>>({});const [ready,setReady]=useState(false);const [storageError,setStorageError]=useState(false);const [refreshing,setRefreshing]=useState(false);
  const current=useRef(links);current.current=links;const controller=useRef<AbortController|null>(null);
  const readStorage=useCallback(()=>{try{const raw=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(raw))setLinks(raw.filter(validLink).slice(0,100));}catch{setStorageError(true)}},[]);
  useEffect(()=>{readStorage();setReady(true);const sync=(e:StorageEvent)=>{if(e.key===storageKey)readStorage()};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)},[readStorage]);
  useEffect(()=>{if(!ready)return;try{localStorage.setItem(storageKey,JSON.stringify(links));setStorageError(false)}catch{setStorageError(true)}},[links,ready]);
  const refresh=useCallback(async()=>{
    controller.current?.abort();const c=new AbortController();controller.current=c;
    const saved=current.current;if(!saved.length){setRefreshing(false);return;}setRefreshing(true);
    const results=await Promise.allSettled(saved.map(q=>readPersonalQuestion(q,c.signal)));
    if(c.signal.aborted)return;
    const next:Record<string,PersonalQuestion>={};const failed:Record<string,string>={};
    results.forEach((r,i)=>{if(r.status==='fulfilled')next[saved[i].id]=r.value;else failed[saved[i].id]=r.reason instanceof Error?r.reason.message:'Не удалось обновить вопрос.'});
    setData(prev=>({...prev,...next}));setErrors(failed);setRefreshing(false);
  },[]);
  const ids=links.map(q=>q.id+q.token).join(',');
  useEffect(()=>{if(!ready)return;void refresh();const check=()=>{if(document.visibilityState==='visible')void refresh()};const interval=setInterval(check,60000);window.addEventListener('focus',check);document.addEventListener('visibilitychange',check);return()=>{clearInterval(interval);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check);controller.current?.abort()}},[ready,ids,refresh]);
  const saveLink=useCallback((link:QuestionLink,question?:PersonalQuestion)=>{setLinks(prev=>{const old=prev.find(q=>q.id===link.id);return old?prev.map(q=>q.id===link.id?{...q,title:link.title}:q):[link,...prev].slice(0,100)});if(question)setData(prev=>({...prev,[question.id]:question}));},[]);
  const setSubscribed=useCallback((id:string,value:boolean)=>setLinks(prev=>prev.map(q=>q.id===id?{...q,subscribed:value}:q)),[]);
  const markRead=useCallback((id:string,answerAt:string)=>setLinks(prev=>prev.map(q=>q.id===id&&q.seenAnswerAt!==answerAt?{...q,seenAnswerAt:answerAt}:q)),[]);
  const update=useCallback((q:PersonalQuestion)=>{setData(prev=>({...prev,[q.id]:q}));setErrors(prev=>{const next={...prev};delete next[q.id];return next})},[]);
  const newAnswer=(q:QuestionLink)=>!!data[q.id]?.answer&&!!data[q.id]?.answerAt&&data[q.id].answerAt!==q.seenAnswerAt;
  const unread=links.filter(q=>q.subscribed&&newAnswer(q)).length;
  return {links,data,errors,ready,storageError,refreshing,refresh,saveLink,setSubscribed,markRead,update,newAnswer,unread};
}
export type QuestionTracker=ReturnType<typeof useQuestions>;
