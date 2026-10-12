import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { User } from '../../users/entities/user.entity';
import { Fine } from '../../fines/entities/fine.entity';

export enum LoanStatus {
  ACTIVE = 'active',
  RETURNED = 'returned',
  OVERDUE = 'overdue',
}

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'book_id' })
  bookId: number;

  @ManyToOne(() => Book, (book) => book.loans, {
    onDelete: 'RESTRICT',
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.loans, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'loan_date', type: 'timestamptz' })
  loanDate: Date;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ name: 'return_date', type: 'timestamptz', nullable: true })
  returnDate: Date | null;

  @Column({ type: 'enum', enum: LoanStatus, default: LoanStatus.ACTIVE })
  status: LoanStatus;

  @OneToMany(() => Fine, (fine) => fine.loan)
  fines: Fine[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
