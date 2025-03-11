import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenHimService } from './openhim/openhim.service';
import { DatabaseModule } from './database/database.module';
import { MyLoggerModule } from './my-logger/my-logger.module';
import { TransfertModule } from './transfert/transfert.module';
import { MercureService } from './mercure/mercure.service';
import { FhirService } from './fhir/fhir.service';
import { RuaService } from './rua/rua.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TransfertModule,
    DatabaseModule,
    MyLoggerModule,
  ],
  exports: [AppService],
  controllers: [AppController],
  providers: [AppService, OpenHimService, MercureService, FhirService, RuaService],
})
export class AppModule {}
