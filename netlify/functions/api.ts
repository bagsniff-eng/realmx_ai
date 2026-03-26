import serverless from 'serverless-http';
import type { Handler } from '@netlify/functions';
import app from '../../src/server/index.js';

// Express routes are mounted at /api/*, but Netlify strips the /api prefix
// before calling this function. We restore it here.
const serverlessHandler = serverless(app, {
  request(req: any) {
    // Netlify functions receive paths like /health instead of /api/health
    // Prepend /api so Express routing works correctly
    if (req.url && !req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
  }
});

export const handler: Handler = async (event, context) => {
  const result = await serverlessHandler(event, context);
  return result as any;
};
