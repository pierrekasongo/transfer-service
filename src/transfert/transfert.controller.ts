import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
  Res,
  Response,
} from '@nestjs/common';
import { TransfertService } from './transfert.service';

@Controller('transfert')
export class TransfertController {
  constructor(private readonly transfertService: TransfertService) {}

  @Post()
  async create(@Body() resource: any) {
    //return this.transfertService.create(resource);
    try {
      return await this.transfertService.create(resource);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('topic') topic?: string,
    @Query('from') from?: Date,
    @Query('to') to?: Date,
  ) {
    try {
      return await this.transfertService.findAll(status, topic, from, to);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    try {
      return this.transfertService.findOne(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() resource: any) {
    try {
      return await this.transfertService.update(id, resource);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    try {
      return this.transfertService.remove(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
