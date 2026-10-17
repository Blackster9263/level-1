import {action} from './_generated/server';
import {v,ConvexError} from 'convex/values';
import {internal} from './_generated/api';
import {fetchGithub,githubUsernameSchema,ReferenceError} from '../lib/references';
import type {GithubReference} from '../lib/types';
export const importProjects=action({args:{username:v.string()},handler:async(ctx,{username}):Promise<{github:GithubReference;snapshotId:string}>=>{const parsed=githubUsernameSchema.safeParse(username);if(!parsed.success)throw new ConvexError({code:'INVALID_INPUT',message:'Enter a GitHub username, not a URL.'});const ticket=await ctx.runMutation(internal.interviews.reserveImport,{});try{const github=await fetchGithub(parsed.data);return await ctx.runMutation(internal.interviews.savePreview,{github,generation:ticket.generation});}catch(e){if(e instanceof ReferenceError)throw new ConvexError({code:e.code,message:e.message});throw e;}}});
