import { handleApiRequest } from '../_handle.js';

export default function handler(req: any, res: any) {
  return handleApiRequest('/api/mining', req, res);
}
