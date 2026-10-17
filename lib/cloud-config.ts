import {env} from 'cloudflare:workers';
import {convexBetterAuthNextJs} from '@convex-dev/better-auth/nextjs';
export function cloudConfig(){return {convexUrl:env.PULSEPREP_CONVEX_URL||'',convexSiteUrl:env.PULSEPREP_CONVEX_SITE_URL||'',siteUrl:env.PULSEPREP_SITE_URL||''};}
export function serverAuth(){const config=cloudConfig();if(!config.convexUrl||!config.convexSiteUrl)throw new Error('CLOUD_SETUP_REQUIRED');return convexBetterAuthNextJs({convexUrl:config.convexUrl,convexSiteUrl:config.convexSiteUrl});}
