import {cronJobs} from 'convex/server';
import {internal} from './_generated/api';
const crons=cronJobs();
crons.interval('Daily shopping feeds', {minutes:15}, internal.dailyFeed.dispatch, {});
crons.interval('Remove abandoned wardrobe photo drafts',{hours:1},internal.wardrobeMetadata.cleanup,{});
export default crons;
