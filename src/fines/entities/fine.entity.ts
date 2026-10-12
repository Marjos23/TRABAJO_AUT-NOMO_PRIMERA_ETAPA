import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Loan } from '../../loans/entities/loan.entity';

@Entity('fines')
export class Fine {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'loan_id' })
  loanId: number;

  @ManyToOne(() => Loan, (loan) => loan.fines, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  amount: string;

  @Column({ length: 255 })
  reason: string;

  @Column({ default: false })
  paid: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
