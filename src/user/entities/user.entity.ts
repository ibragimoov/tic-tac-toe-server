import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Game } from '../../game/entities/game.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column({ default: 0 })
  rating: number;

  @OneToMany(() => Game, (game) => game.playerX)
  gamesAsX: Game[];

  @OneToMany(() => Game, (game) => game.playerO)
  gamesAsO: Game[];
}
