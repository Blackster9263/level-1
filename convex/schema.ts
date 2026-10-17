import {defineSchema,defineTable} from 'convex/server';
import {v} from 'convex/values';
export default defineSchema({
  interviews:defineTable({ownerId:v.string(),publicId:v.string(),roleId:v.string(),status:v.string(),payload:v.string(),report:v.optional(v.string())}).index('by_public',['publicId']).index('by_owner',['ownerId']).index('by_owner_role',['ownerId','roleId']),
  previews:defineTable({ownerId:v.string(),snapshotId:v.string(),username:v.string(),github:v.string(),expiresAt:v.number()}).index('by_snapshot',['snapshotId']).index('by_owner',['ownerId']),
  quotas:defineTable({ownerId:v.string(),bucket:v.string(),count:v.number(),expiresAt:v.number()}).index('by_owner_bucket',['ownerId','bucket']),
  accountState:defineTable({ownerId:v.string(),deletionGeneration:v.number()}).index('by_owner',['ownerId']),
});
