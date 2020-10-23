import {Column, Entity, JoinColumn, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import { ApiModel, ApiModelProperty } from 'swagger-express-ts';
import { MovieVote } from "~/entities/MovieVote";
import { Genre } from './Genre';

@Entity()
@ApiModel({
  description: 'The movie entity.',
  name: 'Movie',
})
export class Movie {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({ length: 50 })
  @ApiModelProperty({
    description: 'The title of the movie',
  })
  title: string;

  @Column({ length: 250 })
  @ApiModelProperty({
    description: 'The description of the movie',
  })
  description: string;

  @Column({ length: 50 })
  @ApiModelProperty({
    description: 'The director of the movie',
  })
  director: string;

  @Column({ enum: Genre, type: 'enum' })
  @ApiModelProperty({
    description: 'The genre of the movie',
  })
  genre: Genre;

  @OneToMany(() => MovieVote, movieVote => movieVote.movie)
  votes: MovieVote[] = [];

  constructor(title: string, description: string, director: string, genre: Genre, votes: MovieVote[]) {
    this.title = title;
    this.description = description;
    this.director = director;
    this.genre = genre;
    this.votes = votes;
  }

  calculateAverageRating(): string {
    let ratingSum: number = -1;
    let counter = 0;

    this.votes.forEach(vote => {
      counter++;
      ratingSum = ratingSum === -1 ? vote.value : ratingSum + vote.value;
    });

    return (ratingSum === -1 ? 'No votes on this movie yet!' : (ratingSum/counter).toString());
  }
}
