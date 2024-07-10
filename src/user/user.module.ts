import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserGateway } from './user.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from 'src/game/entities/game.entity';
import { User } from './entities/user.entity';

@Module({
  providers: [UserGateway, UserService],
  imports: [TypeOrmModule.forFeature([Game, User])],
})
export class UserModule {}
