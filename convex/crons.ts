import {cronJobs} from 'convex/server';
import {internal} from './_generated/api';
const crons=cronJobs();
crons.interval('Daily shopping feeds', {minutes:15}, internal.dailyFeed.dispatch, {});
export default crons;
