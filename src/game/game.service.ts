import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game } from './entities/game.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private roomRepository: Repository<Game>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createRoom(
    username: string,
    role: string,
    socketId: string,
  ): Promise<Game> {
    const user = new User();
    user.username = username;
    await this.userRepository.save(user);

    const room = new Game();
    if (role === 'X') {
      room.playerX = user;
      room.socketIdX = socketId;
    } else {
      room.playerO = user;
      room.socketIdO = socketId;
    }

    return await this.roomRepository.save(room);
  }

  async getRoom(roomId: number): Promise<Game> {
    return await this.roomRepository.findOne({
      where: { id: roomId },
      relations: ['playerX', 'playerO'],
    });
  }

  async joinRoom(
    roomId: number,
    username: string,
    role: string,
    socketId: string,
  ): Promise<Game> {
    const room = await this.getRoom(roomId);
    const user = new User();
    user.username = username;
    await this.userRepository.save(user);

    if (room.playerX) {
      room.playerO = user;
      room.socketIdO = socketId;
    } else {
      room.playerX = user;
      room.socketIdX = socketId;
    }

    return await this.roomRepository.save(room);
  }

  async makeMove(
    roomId: number,
    index: number,
    move: 'X' | 'O',
    player: string,
  ): Promise<any> {
    const room = await this.getRoom(roomId);

    if (!room) throw new Error('Room not found');

    // Инициализация доски, если она еще не была установлена
    let board;
    if (!room.board || room.board === '[]') {
      board = JSON.stringify([
        'X',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    } else {
      board = JSON.parse(room.board);
    }

    // Проверка, что индекс пустой, иначе возвращаем ошибку
    if (board[index]) {
      throw new Error('Cell already occupied');
    }

    // Обновление доски
    board[index] = move;
    room.board = JSON.stringify(board);

    if (room.board === "['X']") {
      room.board = JSON.stringify([
        'X',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
      ]);
    }

    // Сохранение состояния доски в репозитории
    await this.roomRepository.save(room);

    return {
      board,
      move,
      player,
      room,
      isCurrentStepX: move === 'X' ? false : true,
    };
  }

  async restartGame(roomId: number): Promise<any> {
    const room = await this.getRoom(roomId);

    if (!room) throw new Error('Room not found');

    // Сброс состояния игры
    room.board = JSON.stringify(Array(9).fill(null));

    await this.roomRepository.save(room);

    return room;
  }
}
