import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Loan } from '../../loans/entities/loan.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 150 })
  author: string;

  @Column({ unique: true, length: 20 })
  isbn: string;

  @Column({ length: 100 })
  category: string;

  @Column()
  year: number;

  @Column({ default: 1 })
  copies: number;

  @OneToMany(() => Loan, (loan) => loan.book)
  loans: Loan[];
}
