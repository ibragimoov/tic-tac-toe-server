import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { User } from '../user/entities/user.entity';

@Module({
  providers: [GameGateway, GameService],
  imports: [TypeOrmModule.forFeature([Game, User])],
})
export class GameModule {}
