import { defineApp } from 'convex/server';
import staticHosting from '@convex-dev/static-hosting/convex.config';
import workflow from '@convex-dev/workflow/convex.config';
const app = defineApp();
app.use(staticHosting);
app.use(workflow);
export default app;
