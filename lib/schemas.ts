import {z} from 'zod';
import {referenceInputSchema} from './references';
const score=z.number().int().min(0).max(10);
export const evaluationSchema=z.object({scores:z.object({clarity:score,relevance:score,domain:score,communication:score,star:score.nullable()}),feedback:z.string().min(10).max(1600),improvementTip:z.string().min(10).max(800),modelAnswer:z.string().min(30).max(5000)});
export const questionSetSchema=z.object({questions:z.array(z.object({type:z.enum(['technical','behavioral']),text:z.string().min(20).max(1600)})).min(6).max(8)}).refine(s=>s.questions.some(q=>q.type==='behavioral')&&s.questions.some(q=>q.type==='technical'),'Include both question types');
export const createSchema=z.object({roleId:z.string().max(80),level:z.enum(['fresher','0-1']).default('fresher'),mode:z.enum(['practice','full']).default('practice'),demo:z.boolean().default(false),references:referenceInputSchema.optional()});
export const answerSchema=z.object({questionId:z.string().uuid(),text:z.string().trim().max(12000).refine(v=>v.split(/\s+/).filter(Boolean).length>=10,'Write at least 10 words to get useful feedback.')});
export const skipSchema=z.object({questionId:z.string().uuid()});
