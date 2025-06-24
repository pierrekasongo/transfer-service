import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TerritorialeService {
  constructor(private readonly configService: ConfigService) {}

  private terURL = this.configService.get<string>('TERRITORIAL_URL');

  async getAllESS() {
    const essMap = new Map<string, string>();
    try {
      const result = await axios.get(`${this.terURL}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      for (const ess of result.data) {
        essMap.set(ess?.codeEtablissementSoinSante, ess?.denomination);
      }
      return essMap;
    } catch (error) {
      console.error('Error fetching data:', error);
      return null;
    }
  }
}
