import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import { StatusCodes } from 'http-status-codes';
import {
  ApiOperationDelete,
  ApiOperationGet,
  ApiOperationPost,
  ApiPath,
  SwaggerDefinitionConstant
} from "swagger-express-ts";

import { Movie } from '~/entities/Movie';
import { validate } from 'class-validator';
import { Logger } from '~/shared-kernel/Logger';
import {User} from "~/entities/User";
import {MovieVote} from "~/entities/MovieVote";


@ApiPath({
  path: '/movies',
  name: 'Movies',
  security: { tokenHeader: [] },
})
export class MovieController {
  @ApiOperationGet({
    path: '/',
    description: 'Get all movies',
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.ARRAY,
        model: 'Movie',
      },
    },
  })
  async get(req: Request, res: Response) {
    Logger.log(`Finding all movies`, 'MovieController');
    const movieRepository = getRepository(Movie);

    const { director, title, genre } = req.query;
    let query = [];
    if(director) {
      query.push({director: director});
    }
    if(title) {
      query.push({title: title});
    }
    if(genre) {
      query.push({genre: genre});
    }

    const movies = await movieRepository.find({
      where: query,
      select: ['id', 'title', 'description', 'director', 'genre'],
      relations: ["votes"]
    });

    let moviesWithAverage = movies.map((movie) => {
      let averageRating: number = -1;
      movie.votes.forEach(vote => {
        averageRating = averageRating === -1 ? vote.value : averageRating + vote.value;
      });

      const strAverageRating: string = averageRating === -1 ? 'No votes on this movie yet!' : averageRating.toString();
      const {votes: votes, ...movieWithoutVotes} = movie;
      return {movie: movieWithoutVotes, averageRating: strAverageRating};
    });

    res.send(moviesWithAverage);
  }

  @ApiOperationGet({
    path: '/{id}',
    parameters: {
      path: {
        id: {
          name: 'id',
          type: SwaggerDefinitionConstant.Parameter.Type.STRING,
          description: 'The movie id',
        },
      },
    },
    description: 'Gets an movie by its id',
    responses: {
      200: {
        description: 'Success',
        type: SwaggerDefinitionConstant.Response.Type.OBJECT,
        model: 'Movie',
      },
      404: { description: 'Movie not found' },
    },
  })
  async getById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);

      Logger.log(`Finding movie ${id}`, 'MovieController');
      const movieRepository = getRepository(Movie);

      const movie = await movieRepository.findOne(id, {
        select: ['id', 'title', 'description', 'director', 'genre'],
      });
      if (!movie) {
        res.status(StatusCodes.NOT_FOUND).send(`Movie not found`);
        return;
      }

      res.send(movie);
    } catch (err) {
      Logger.error(`Error in finding the movie. ${err.message}`, err.trace, 'MovieController');
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  }

  @ApiOperationPost({
    path: '/',
    description: 'Creates a movie',
    parameters: {
      body: { description: 'New Movie', required: true, model: 'Movie' },
    },
    responses: {
      201: { description: 'Movie created' },
      400: { description: 'Parameters fail' },
    },
  })
  async create(req: Request, res: Response) {
    try {
      Logger.log(`Creating movie`, 'MovieController');
      const movieRepository = getRepository(Movie);

      const { title, description, director, genre } = req.body;
      if (!(title && description)) {
        res.status(StatusCodes.BAD_REQUEST).send('Invalid parameters passed to request.');
        return;
      }

      const movie = new Movie(title, description, director, genre, []);
      const errors = await validate(movie);
      if (errors.length > 0) {
        let errorMessage = 'Validation error - ';
        errors.forEach(error => errorMessage += error.toString());
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(errorMessage);
        return;
      }

      const createdMovie = await movieRepository.save(movie);
      res.status(StatusCodes.CREATED).send(createdMovie);
    } catch (err) {
      Logger.error(`Error in creating the movie. ${err.message}`, err.trace, 'MovieController');
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  }

  @ApiOperationPost({
    path: '/{id}/votes',
    description: 'Votes on a specific movie',
    parameters: {
      body: { description: 'Movie vote', required: true, model: 'MovieVote' },
    },
    responses: {
      201: { description: 'Vote created successfully.' },
      400: { description: 'Invalid parameters passed to request.' },
    },
  })
  async vote(req: Request, res: Response) {
    try {
      Logger.log(`Voting on movie`, 'MovieController');

      const id = Number(req.params.id);
      const movieRepository = getRepository(Movie);
      const movie = await movieRepository.findOne(id);
      if (!movie) {
        res.status(StatusCodes.NOT_FOUND).send(`Movie not found.`);
        return;
      }

      const { value } = req.body;
      if (!value) {
        res.status(StatusCodes.BAD_REQUEST).send('Invalid parameters passed to request.');
        return;
      }

      const user = await getRepository(User).findOne(req.user.id);
      if (!user) {
        res.status(StatusCodes.NOT_FOUND).send(`User not found or not authenticated.`);
        return;
      }

      console.log();

      const movieVote = new MovieVote(user, movie, value);
      const errors = await validate(movieVote);
      if (errors.length > 0) {
        let errorMessage = 'Validation error - ';
        errors.forEach(error => errorMessage += error.toString());
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).send(errorMessage);
        return;
      }

      const createdMovieVote = await getRepository(MovieVote).save(movieVote);
      res.status(StatusCodes.CREATED).send(createdMovieVote);
    } catch (err) {
      Logger.error(`Error while voting in movie. ${err.message}`, err.trace, 'MovieController');
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  }

  @ApiOperationDelete({
    path: '/{id}',
    description: 'Deletes an movie. The deletion is logical',
    parameters: {
      path: {
        id: {
          name: 'id',
          type: SwaggerDefinitionConstant.Parameter.Type.STRING,
          description: 'The movie id',
        },
      },
    },
    responses: {
      204: { description: 'No content' },
      400: { description: 'Parameters fail' },
      404: { description: 'Movie not found' },
    },
  })
  async delete(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      Logger.log(`Deleting movie ${id}`, 'MovieController');
      const movieRepository = getRepository(Movie);

      const movie = await movieRepository.findOne(id);
      if (!movie) {
        res.status(StatusCodes.NOT_FOUND).send(`Movie not found`);
        return;
      }

      await movieRepository.softDelete(id);
      res.status(StatusCodes.NO_CONTENT).send();
    } catch (err) {
      Logger.error(`Error in deleting the movie. ${err.message}`, err.trace, 'MovieController');
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  }
}
