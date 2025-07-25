import { Module } from '@nestjs/common';
import { TransfertService } from './transfert.service';
import { TransfertController } from './transfert.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MercureService } from 'src/mercure/mercure.service';
import { FhirService } from 'src/fhir/fhir.service';
import { RuaService } from 'src/rua/rua.service';
import { TerritorialeService } from 'src/territoriale/territoriale.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TransfertController],
  providers: [
    TransfertService,
    MercureService,
    FhirService,
    RuaService,
    TerritorialeService,
  ],
})
export class TransfertModule {}
