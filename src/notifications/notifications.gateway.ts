import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        // Remove user mapping
        for (const [userId, socketId] of this.connectedUsers.entries()) {
            if (socketId === client.id) {
                this.connectedUsers.delete(userId);
                break;
            }
        }
    }

    @SubscribeMessage('register')
    handleRegister(client: Socket, userId: string) {
        this.connectedUsers.set(userId, client.id);
        return { status: 'registered', userId };
    }

    sendToUser(userId: string, event: string, data: any) {
        const socketId = this.connectedUsers.get(userId.toString());
        if (socketId) {
            this.server.to(socketId).emit(event, data);
        }
    }

    broadcast(event: string, data: any) {
        this.server.emit(event, data);
    }
}
