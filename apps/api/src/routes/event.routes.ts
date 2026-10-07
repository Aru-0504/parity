import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { sseService } from '../services/sse.service';

const router = Router();

// GET /api/events - Server-Sent Events real-time sync stream
router.get('/', authenticate, (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const userId = req.user!.id;
  sseService.registerClient(userId, res);
});

export default router;
