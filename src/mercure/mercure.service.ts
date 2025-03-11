import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { RuaService } from 'src/rua/rua.service';

@Injectable()
export class MercureService {
  constructor(
    private readonly configService: ConfigService,
    private readonly ruaService: RuaService,
  ) {}
  private mercureUrl =
    this.configService.get<string>('MERCURE_URL') ||
    'http://localhost:3000/.well-known/mercure';
  private mercurePublisherSecret = this.configService.get<string>(
    'MERCURE_PUBLISHER_SECRET',
  );

  // Generate JWT Token for Mercure
  private generateJwtToken(topic) {
    return jwt.sign(
      { mercure: { publish: [topic] } }, // Allow publishing to all topics
      this.mercurePublisherSecret,
      { algorithm: 'HS256' },
    );
  }

  // Publish Message to Mercure
  async publish(topic, data) {
    try {
      // Get patient data from RUA
      const patient = await this.ruaService.getPatientByINS(data.patient_ins);

      data.patient = {
        id_adresse: patient.id_adresse,
        ins: patient.ins,
        nom: patient.nom,
        postnom: patient.postnom,
        prenom: patient.prenom,
        telephone_principal: patient.telephone_principal,
        canal_enregistrement: patient.canal_enregistrement,
        initial_sexe: patient.initial_sexe,
        adresse: patient.adresse,
      };
      const jwtToken = this.generateJwtToken(topic);
      await axios.post(
        this.mercureUrl,
        `topic=${encodeURIComponent(topic)}&data=${encodeURIComponent(
          JSON.stringify(data),
        )}`,
        {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      //await kafkaMercure.saveToDB(topic, data.id);
      console.log(`✅ Published to Mercure: ${topic}`);
    } catch (error) {
      console.error(
        '❌ Mercure Publish Error:',
        error.response?.data || error.message,
      );
    }
  }
}
