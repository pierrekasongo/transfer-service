import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RuaService {
  constructor(private readonly configService: ConfigService) {}

  private ruaURL = this.configService.get<string>('RUA_URL');
  private ruaToken = this.configService.get<string>('RUA_TOKEN');
  async getPatientByINS(ins: string) {
    try {
      const result = await axios.get(`${this.ruaURL}/personnes/ins/${ins}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.ruaToken,
        },
      });
      return result?.data.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }
}
