import { handleApiRequest } from '../_handle.js';

export default function handler(req: any, res: any) {
  return handleApiRequest('/api/tasks', req, res);
}
