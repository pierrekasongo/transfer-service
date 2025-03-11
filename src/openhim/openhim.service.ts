const fs = require('fs');
const path = require('path');
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const mediatorUtils = require('openhim-mediator-utils');

@Injectable()
export class OpenHimService {
  constructor(private readonly configService: ConfigService) {}
  private mediatorConfigJson;
  private readError;

  private getConfig() {
    return Object.freeze({
      host: this.configService.get<string>('HOST'),
      port: this.configService.get<string>('PORT'),
      logLevel: this.configService.get<string>('LOG_LEVEL') || 'info',
      enableLogging: true,
      openhim: Object.freeze({
        apiURL: this.configService.get<string>('OPENHIM_URL'),
        trustSelfSigned: true,
        username: this.configService.get<string>('OPENHIM_USERNAME'),
        password: this.configService.get<string>('OPENHIM_PASSWORD'),
        register: this.configService.get<string>('OPENHIM_REGISTER'),
        urn: this.configService.get<string>('MEDIATOR_URN'),
      }),
    });
  }
  mediatorSetup() {
    try {
      const mediatorConfigFile = fs.readFileSync(
        path.resolve(
          __dirname,
          '../../',
          'src',
          'openhim',
          'mediatorConfig.json',
        ),
      );
      this.mediatorConfigJson = JSON.parse(mediatorConfigFile);

      // Update the routes' host and port with values from .env
      // Loop through each channel and update routes' host and port
      if (
        this.mediatorConfigJson &&
        Array.isArray(this.mediatorConfigJson.defaultChannelConfig)
      ) {
        this.mediatorConfigJson.defaultChannelConfig.forEach((channel) => {
          if (channel.routes && Array.isArray(channel.routes)) {
            channel.routes.forEach((route) => {
              // Update host and port with values from .env, if provided
              route.host =
                this.configService.get<string>('MEDIATOR_HOST') || 'localhost';
              route.port =
                this.configService.get<string>('MEDIATOR_PORT') || '3005';
            });
          }
        });
      }
    } catch (err) {
      this.readError = err.message;
      console.error(
        `Mediator config file could not be retrieved: ${err.message}`,
      );
    }

    const configOptions = this.getConfig();
    const openhimConfig = Object.assign(
      { urn: this.mediatorConfigJson.urn },
      configOptions.openhim,
    );
    this.mediatorConfigJson = Object.assign({}, this.mediatorConfigJson, {
      urn: configOptions.openhim.urn,
    });

    mediatorUtils.registerMediator(
      openhimConfig,
      this.mediatorConfigJson,
      (error) => {
        if (error) {
          console.error(
            `Failed to register mediator. Caused by: ${error.message}`,
          );
          throw error;
        }

        console.log('Successfully registered mediator!');

        const emitter = mediatorUtils.activateHeartbeat(openhimConfig);

        emitter.on('error', (openhimError) => {
          console.error('Heartbeat failed: ', openhimError);
        });
      },
    );
  }
}

//let mediatorConfigJson, readError;

//exports.mediatorSetup = mediatorSetup;
