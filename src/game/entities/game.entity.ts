import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.gamesAsX, { onDelete: 'CASCADE' })
  playerX: User;

  @ManyToOne(() => User, (user) => user.gamesAsO, { onDelete: 'CASCADE' })
  playerO: User;

  @Column({ default: 'in-progress' })
  status: string;

  @Column({ default: '[]' })
  board: string;

  @Column({ type: 'int', default: 3 })
  boardSize: number;
}
