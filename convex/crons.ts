import {cronJobs} from 'convex/server';
import {internal} from './_generated/api';
const crons=cronJobs();
crons.interval('Daily shopping feeds', {minutes:15}, internal.dailyFeed.dispatch, {});
crons.interval('Remove abandoned wardrobe photo drafts',{hours:1},internal.wardrobeMetadata.cleanup,{});
crons.interval('Expire virtual try-on previews',{hours:1},internal.tryOn.cleanup,{});
crons.interval('Expire discovery product pools',{minutes:10},internal.discoveryCache.cleanup,{});
export default crons;
