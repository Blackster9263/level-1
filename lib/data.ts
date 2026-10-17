import data from './seed-data.json';
import type {Role} from './types';
export const roles:Role[]=data;
export const publicRoles=roles.map(({id,title,description,icon})=>({id,title,description,icon}));
export const findRole=(id:string)=>roles.find(r=>r.id===id);
