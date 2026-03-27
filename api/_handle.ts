export async function handleApiRequest(prefix: string, req: any, res: any) {
  try {
    const { default: app } = await import('../src/server/index.js');

    if (req.url && !req.url.startsWith('/api')) {
      req.url = `${prefix}${req.url === '/' ? '' : req.url}`;
    }

    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: message });
  }
}
