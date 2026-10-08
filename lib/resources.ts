import entries from './resource-seed.json';
export type ResourceGroup='basics'|'movement'|'creative'|'blocks'|'web'|'python'|'design';
export type Resource={id:string;name:string;group:ResourceGroup;type:string;url:string;cost:string;setup:string;task:string;limits:string;source:string;checked:string;time:string;minutes:number;level:string;device:string;access:string;outcome:string;tags:string[]};
export const resources=entries as Resource[];
export const resourceGroups:{id:ResourceGroup;name:string;color:string}[]=[
  {id:'movement',name:'Физкультминутки',color:'#267766'},
  {id:'creative',name:'Творческий перерыв',color:'#a14373'},
  {id:'basics',name:'Компьютерные навыки',color:'#1764a4'},
  {id:'blocks',name:'Блоки и мини-игры',color:'#6953b8'},
  {id:'web',name:'HTML и CSS',color:'#bd6330'},
  {id:'python',name:'Python',color:'#39757e'},
  {id:'design',name:'Графика и 3D',color:'#516379'},
];
