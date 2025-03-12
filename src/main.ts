import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './all-exceptions-filter';
import { OpenHimService } from './openhim/openhim.service';
import { MyLoggerService } from './my-logger/my-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useLogger(app.get(MyLoggerService));
  app.enableCors();
  //app.setGlobalPrefix('api');
  app.useLogger(app.get(MyLoggerService));
  // Ensure the app is fully initialized before calling the OpenHIM service
  await app.init();
  const openHimService = app.get(OpenHimService);
  openHimService.mediatorSetup();

  //if (config.openhim.register) {

  //}
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
