import { Response } from 'express';
import { ParityRealtimeEvent } from '@ismo/shared';
import { logger } from '../utils/logger';

class SSEService {
  private clients: Map<string, Set<Response>> = new Map();

  constructor() {
    // Keep-alive heartbeat every 20s
    setInterval(() => {
      this.sendHeartbeat();
    }, 20000);
  }

  public registerClient(userId: string, res: Response): void {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }

    const userClients = this.clients.get(userId)!;
    userClients.add(res);

    logger.info(`[SSE] Client connected for user ${userId}. Total user connections: ${userClients.size}`);

    const welcomeEvent: ParityRealtimeEvent = {
      type: 'CONNECTED',
      timestamp: new Date().toISOString(),
      data: { message: 'Real-time synchronization connected' },
    };
    res.write(`data: ${JSON.stringify(welcomeEvent)}\n\n`);

    res.on('close', () => {
      userClients.delete(res);
      if (userClients.size === 0) {
        this.clients.delete(userId);
      }
      logger.info(`[SSE] Client disconnected for user ${userId}. Remaining: ${userClients.size}`);
    });
  }

  public broadcastToUser<T>(userId: string, event: ParityRealtimeEvent<T>): void {
    const userClients = this.clients.get(userId);
    if (!userClients || userClients.size === 0) {
      return;
    }

    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of userClients) {
      try {
        res.write(payload);
      } catch (err) {
        logger.error(`[SSE] Error broadcasting to client: ${err}`);
      }
    }
  }

  private sendHeartbeat(): void {
    for (const [userId, clientSet] of this.clients.entries()) {
      for (const res of clientSet) {
        try {
          res.write(': keepalive-ping\n\n');
        } catch {
          clientSet.delete(res);
        }
      }
      if (clientSet.size === 0) {
        this.clients.delete(userId);
      }
    }
  }
}

export const sseService = new SSEService();
