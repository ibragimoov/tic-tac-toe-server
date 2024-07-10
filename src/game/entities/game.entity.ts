import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.gamesAsX)
  playerX: User;

  @ManyToOne(() => User, (user) => user.gamesAsO)
  playerO: User;

  @Column({ default: null })
  socketIdX: string;

  @Column({ default: null })
  socketIdO: string;

  @Column({ default: 'in-progress' })
  status: string;

  @Column({ default: '[]' })
  board: string;
}
