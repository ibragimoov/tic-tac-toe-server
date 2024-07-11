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

  afterInit(server: Server) {
    console.log('Initialized');
  }

  handleConnection(client: Socket) {
    // console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    // console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('createRoom')
  async handleCreateRoom(
    @MessageBody() data: { username: string; role: string; socketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.createRoom(
      data.username,
      data.role,
      data.socketId,
    );
    client.join(String(room.id));
    this.server.to(client.id).emit('roomCreated', room);
  }

  @SubscribeMessage('getRoom')
  async handleGetRoom(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.getRoom(data.roomId);
    if (room) {
      client.emit('getRoomResponse', { success: true, room });
    } else {
      client.emit('getRoomResponse', { success: false });
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody()
    data: { roomId: number; username: string; role: string; socketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = await this.gameService.getRoom(data.roomId);

    if (!room) {
      client.emit('joinRoomResponse', {
        success: false,
        message: 'Room not found',
      });
      return;
    }

    if (room.playerO && room.playerX) {
      client.emit('joinRoomResponse', {
        success: false,
        message: 'Room is full',
      });
    } else {
      const updatedRoom = await this.gameService.joinRoom(
        data.roomId,
        data.username,
        data.role,
        data.socketId,
      );
      this.server.to(String(updatedRoom.id)).emit('playerJoined', updatedRoom);
      client.join(String(updatedRoom.id));
      client.emit('joinRoomResponse', { success: true, room: updatedRoom });
      this.server.to(String(data.roomId)).emit('getPlayerFirstMove', {
        socketId: updatedRoom.socketIdX,
      });
    }
  }

  @SubscribeMessage('startGame')
  handleStartGame(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(data.roomId.toString()).emit('gameStarted');
  }

  @SubscribeMessage('makeMove')
  async handleMakeMove(
    @MessageBody()
    data: {
      roomId: number;
      index: number;
      move: 'X' | 'O';
      player: string;
      socketId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.gameService.makeMove(
      data.roomId,
      data.index,
      data.move,
      data.player,
    );

    this.server.to(String(data.roomId)).emit('gameStateUpdate', {
      boardState: result.board,
      currentStepX: result.isCurrentStepX,
      socketId:
        data.move === 'X' ? result.room.socketIdO : result.room.socketIdX,
    });
  }

  @SubscribeMessage('restartGame')
  async handleRestartGame(
    @MessageBody() data: { roomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    // Обновите состояние комнаты в базе данных
    const room = await this.gameService.restartGame(data.roomId);

    // Уведомите всех игроков в комнате о том, что игра перезапущена
    this.server.to(String(data.roomId)).emit('gameStateUpdate', {
      boardState: JSON.parse(room.board),
      currentStepX: true,
      socketId: room.socketIdX,
      isRestart: true,
    });
  }
}
