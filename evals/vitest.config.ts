import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['evals/live.eval.ts'],environment:'edge-runtime',testTimeout:150000,hookTimeout:30000,fileParallelism:false,maxWorkers:1,reporters:['default']}});
