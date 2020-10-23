import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import { ApiModel, ApiModelProperty } from 'swagger-express-ts';
import { User } from "~/entities/User";
import { Movie } from "~/entities/Movie";

@Entity()
@ApiModel({
  description: 'The movie vote entity.',
  name: 'MovieVote',
})
export class MovieVote {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column()
  @ApiModelProperty({
    description: 'The vote value'
  })
  value: number;

  @ManyToOne(() => User)
  @ApiModelProperty({
    description: 'The user responsible for the vote'
  })
  user: User;

  @ManyToOne(() => Movie, movie => movie.votes)
  // @ApiModelProperty({
  //   description: 'The movie the user has voted on'
  // })
  @JoinColumn({name : 'movieId'})
  movie: Movie;

  constructor(user: User, movie: Movie, value: number) {
    this.value = value;
    this.user = user;
    this.movie = movie;
  }
}
