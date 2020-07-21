import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';

@Module({
  providers: [GenreService],
  controllers: [GenreController]
})
export class GenreModule {}
