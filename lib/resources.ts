import entries from './resource-seed.json';
export type ResourceGroup='basics'|'movement'|'creative'|'blocks'|'web'|'python'|'design';
export type Resource={id:string;name:string;group:ResourceGroup;type:string;url:string;cost:string;setup:string;task:string;limits:string;source:string;checked:string;time:string;minutes:number;level:string;device:string;access:string;outcome:string;tags:string[]};
export const resources=entries as Resource[];
export const resourceGroups:{id:ResourceGroup;name:string;color:string}[]=[
  {id:'movement',name:'Физкультминутки',color:'#4d6514'},
  {id:'creative',name:'Творческий перерыв',color:'#78633e'},
  {id:'basics',name:'Компьютерные навыки',color:'#5c7418'},
  {id:'blocks',name:'Блоки и мини-игры',color:'#8a6a22'},
  {id:'web',name:'HTML и CSS',color:'#96611b'},
  {id:'python',name:'Python',color:'#647747'},
  {id:'design',name:'Графика и 3D',color:'#65616d'},
];
