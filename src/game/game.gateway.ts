import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway()
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(private gameService: GameService) {}

  afterInit() {
    console.log('Initialized');
  }

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  async handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.rooms);
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody()
    data: {
      username: string;
      role: string;
      boardSize: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.createRoom(
      data.username,
      data.role,
      data.boardSize,
    );

    client.join(String(room.id));
    client.emit('roomCreated', room);
  }

  @SubscribeMessage('getRoom')
  async handleGetRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.getRoom(data.roomId);

    const clientsInRoom = await this.server.in(String(room.id)).fetchSockets();
    const numberOfClients: number = clientsInRoom.length;

    const isPlayersExist = !!(room.playerX || room.playerO);
    const isHostConnecting: boolean = clientsInRoom[0]?.id === client.id;

    if (numberOfClients === 1 && isPlayersExist && isHostConnecting) {
      client.emit('getRoomResponse', {
        success: true,
        room,
        myMove: room.playerX ? 'X' : 'O',
      });
    } else {
      client.emit('getRoomResponse', { success: false });
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody()
    data: { roomId: number; username: string; role: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.getRoom(data.roomId);

    if (!room) {
      client.emit('roomError', {
        success: false,
        message: 'Room not found',
      });
      return;
    }

    if (room.playerO && room.playerX) {
      client.emit('roomError', {
        success: false,
        message: 'Room is full',
      });
    }

    const updatedRoom: any = await this.gameService.joinRoom(
      data.roomId,
      data.username,
    );

    client.join(String(room.id));
    this.server.to(String(room.id)).emit('playerJoined', {
      success: true,
      room: updatedRoom,
      myMove: room.playerO ? 'X' : 'O',
    });
  }

  @SubscribeMessage('makeMove')
  async handleMakeMove(
    @MessageBody()
    data: {
      roomId: number;
      index: number;
      move: 'X' | 'O';
      isCurrentStepX: boolean;
    },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(String(data.roomId)).emit('gameStateUpdate', {
      indexSquare: data.index,
      currentStepX: !data.isCurrentStepX,
      move: data.move,
    });
    await this.gameService.makeMove(data.roomId, data.index, data.move);
  }

  @SubscribeMessage('restartGame')
  async handleRestartGame(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(String(data.roomId)).emit('restartGame');
  }

  @SubscribeMessage('sendEmoji')
  async handleEmojiSent(
    @MessageBody()
    data: { roomId: number; from: string; emoji: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.broadcast.to(String(data.roomId)).emit('handleEmoji', {
      message: data.emoji,
    });
  }
}
