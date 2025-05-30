
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyToken } from './auth';
import { storage } from './storage';
import { logSecurityEvent } from './monitoring';

export interface WSMessage {
  type: 'notification' | 'service_update' | 'review_added' | 'admin_message';
  data: any;
  userId?: string;
  timestamp: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, WebSocket>();
  private userConnections = new Map<string, Set<string>>();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/api/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log('✅ WebSocket server initialized');
  }

  private async verifyClient(info: any): Promise<boolean> {
    try {
      const url = new URL(info.req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (!token) return false;
      
      const decoded = verifyToken(token);
      if (!decoded) return false;

      // Store user info for connection
      info.req.userId = decoded.userId.toString();
      return true;
    } catch {
      return false;
    }
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const userId = req.userId;
    const connectionId = this.generateConnectionId();
    
    // Store connection
    this.connections.set(connectionId, ws);
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    logSecurityEvent('websocket_connected', { userId, connectionId }, 'info');

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(userId, message, ws);
      } catch (error) {
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Invalid message format' 
        }));
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      this.connections.delete(connectionId);
      this.userConnections.get(userId)?.delete(connectionId);
      
      if (this.userConnections.get(userId)?.size === 0) {
        this.userConnections.delete(userId);
      }
      
      logSecurityEvent('websocket_disconnected', { userId, connectionId }, 'info');
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString()
    }));
  }

  private handleMessage(userId: string, message: any, ws: WebSocket): void {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      case 'subscribe':
        // Handle subscription to specific channels
        break;
      default:
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Unknown message type' 
        }));
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, message: WSMessage): void {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) return;

    const messageStr = JSON.stringify(message);
    userConnections.forEach(connectionId => {
      const ws = this.connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  // Broadcast to all admin users
  async broadcastToAdmins(message: WSMessage): Promise<void> {
    const adminUsers = await storage.getUsersByRole('admin');
    adminUsers.forEach(admin => {
      this.sendToUser(admin.id.toString(), message);
    });
  }

  // Broadcast service updates to all users
  broadcastServiceUpdate(serviceId: number, type: 'created' | 'updated' | 'approved'): void {
    const message: WSMessage = {
      type: 'service_update',
      data: { serviceId, updateType: type },
      timestamp: new Date().toISOString()
    };

    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

export const wsManager = new WebSocketManager();
