import {createClient,type GenericCtx} from '@convex-dev/better-auth';
import {convex} from '@convex-dev/better-auth/plugins';
import {betterAuth} from 'better-auth/minimal';
import type {DataModel} from './_generated/dataModel';
import {components} from './_generated/api';
import authConfig from './auth.config';
export const authComponent=createClient<DataModel>(components.betterAuth);
export function createAuth(ctx:GenericCtx<DataModel>){
  const siteURL=process.env.SITE_URL,secret=process.env.BETTER_AUTH_SECRET;
  if(!siteURL||!secret||secret.length<32)throw new Error('Configure SITE_URL and a strong BETTER_AUTH_SECRET in Convex.');
  // Keep checks enabled in every environment; Better Auth otherwise skips origins in tests.
  return betterAuth({baseURL:siteURL,secret,trustedOrigins:[siteURL],database:authComponent.adapter(ctx),emailAndPassword:{enabled:true,minPasswordLength:12,maxPasswordLength:128,requireEmailVerification:false},account:{accountLinking:{enabled:false}},advanced:{disableOriginCheck:false,disableCSRFCheck:false,useSecureCookies:siteURL.startsWith('https:'),cookiePrefix:'pulseprep'},rateLimit:{enabled:true,storage:'database',window:60,max:30,customRules:{'/sign-in/email':{window:60,max:5},'/sign-up/email':{window:60,max:3}}},plugins:[convex({authConfig})]});
}
