import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}
