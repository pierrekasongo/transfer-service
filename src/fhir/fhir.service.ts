import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ActionEnum } from 'src/common/enums/action.enum';
//import { PatientRUA, Address } from './types';

@Injectable()
export class FhirService {
  constructor(private readonly configService: ConfigService) {}
  private fhirServerUrl = this.configService.get<string>('FHIR_URL');
  private fhirExtensionUri = this.configService.get<string>('EXTENSION_URI');
  private extension_url = this.configService.get<string>('EXTENSION_URI');
  private codesystem_url = this.configService.get<string>('CODESYSTEM_URI');
  private valueset_url = this.configService.get<string>('VALUESET_URI');

  async flattenResource(resource: any) {
    const source_id = resource.extension
      ?.find((ext) => ext.url === `${this.fhirExtensionUri}/Source`)
      ?.valueReference.reference.split('/')
      .pop();

    const source = resource.extension?.find(
      (ext) => ext.url === `${this.fhirExtensionUri}/Source`,
    )?.valueReference.display;

    const destination_id = resource.extension
      ?.find((ext) => ext.url === `${this.fhirExtensionUri}/Destination`)
      ?.valueReference.reference.split('/')
      .pop();
    const destination = resource.extension?.find(
      (ext) => ext.url === `${this.fhirExtensionUri}/Destination`,
    )?.valueReference.display;

    const user = resource.extension?.find(
      (ext) => ext.url === `${this.fhirExtensionUri}/UserReference`,
    )?.valueString;

    const status = resource.status;

    const patient_ins = resource.subject.reference.split('/').pop();

    //TODO: get patient from RUA

    const note = resource.payload[0].contentString;

    // Get fhir resource and return flatten version as CreateTransfertDto
    const flatten = {
      source_id,
      source,
      destination_id,
      destination,
      note,
      patient_ins,
      status,
      user,
    };

    return flatten;
  }
  async putResource(resource: any, action: ActionEnum) {
    try {
      let url = `${this.fhirServerUrl}/${resource.resourceType}`;

      let result;

      if (action === ActionEnum.PUT) {
        if (resource?.id) {
          url += `/${resource.id}`;

          result = await axios.put(url, resource, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } else {
          return {
            status: HttpStatus.NOT_FOUND,
            message: `Resource missing ID for PUT request`,
          };
        }
      } else {
        result = await axios.post(url, resource, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      //console.log("Result", result);
      return { status: HttpStatus.CREATED, data: result.data };
    } catch (error) {
      //console.log('Error', error.response?.data.issue[0]);
      return {
        status: HttpStatus.BAD_REQUEST,
        message: error.response?.data.issue[0],
      };
    }
  }

  // Check if location doesn't exist, then create it first
  async ensureLocationExists(id: string, name: string) {
    const locationUrl = `${this.fhirServerUrl}/Location/${id}`;

    try {
      // Step 1: Check if Location already exists
      await axios.get(locationUrl);
      //throw new ConflictException(`Location with ID ${id} already exists.`);
    } catch (error) {
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        // Step 2: If Not Found (404), create the Location
        const newLocation = { resourceType: 'Location', id, name };

        try {
          const response = await axios.put(locationUrl, newLocation);
          return response.data; // Return created Location
        } catch (postError) {
          throw new InternalServerErrorException(
            `Failed to create Location: ${postError.message}`,
          );
        }
      }

      // Handle other errors
      throw new InternalServerErrorException(
        `Error checking Location: ${error.message}`,
      );
    }
  }
  private async matchPatientToFHIR(patientRUA) {
    let patientFHIR = {
      resourceType: 'Patient',
      extension: [
        {
          url: `${this.extension_url}/Religion`,
          valueCoding: {
            system: `${this.codesystem_url}/religion-codesystem`,
            code: patientRUA?.initial_religion,
          },
        },
        {
          url: `${this.extension_url}/OriginProvince`,
          valueReference: {
            reference:
              patientRUA?.province_origine_id &&
              `Organization/${patientRUA?.province_origine_id}`,
            display: patientRUA?.province_origine,
          },
        },
        {
          url: `${this.extension_url}/OriginCity`,
          valueReference: {
            reference:
              patientRUA?.territoire_ville_origine_id &&
              `Organization/${patientRUA?.territoire_ville_origine_id}`,
            display: patientRUA?.territoire_ville_origine,
          },
        },
        {
          url: `${this.extension_url}/OriginSector`,
          valueReference: {
            reference:
              patientRUA?.commune_secteur_chefferie_origine_id &&
              `Organization/${patientRUA?.commune_secteur_chefferie_origine_id}`,
            display: patientRUA?.commune_secteur_chefferie_origine,
          },
        },
        {
          url: `${this.extension_url}/Program`,
          valueCoding: {
            system: `${this.codesystem_url}/program-codesystem`,
            code: patientRUA?.programmes_personne[0]?.initial_programme,
          },
        },
        {
          url: `${this.extension_url}/Profession`,
          valueString: patientRUA?.profession,
        },
        {
          url: `${this.extension_url}/EducationLevel`,
          valueCoding: {
            system: `${this.codesystem_url}/education-level-codesystem`,
            code: patientRUA?.initial_niveau_etude,
          },
        },
        {
          url: `${this.extension_url}/Company`,
          valueString: patientRUA?.compagnie,
        },
        {
          url: `${this.extension_url}/IsFormalSector`,
          valueBoolean: patientRUA?.is_secteur_formel,
        },
        {
          url: `${this.extension_url}/IsPublicCompany`,
          valueBoolean: patientRUA?.is_compagnie_publique,
        },
        {
          url: `${this.extension_url}/Position`,
          valueString: patientRUA?.fonction,
        },
        {
          url: `${this.extension_url}/Grade`,
          valueString: patientRUA?.grade,
        },
        {
          url: `${this.extension_url}/OriginVillage`,
          valueReference: {
            reference:
              patientRUA?.quartier_village_origine_id &&
              `Organization/${patientRUA?.quartier_village_origine_id}`,
            display: patientRUA?.quartier_village_origine,
          },
        },
        {
          url: `${this.extension_url}/RegistrationChannel`,
          valueString: patientRUA?.canal_enregistrement,
        },
        {
          url: `${this.extension_url}/EstablishmentReference`,
          valueReference: {
            reference:
              patientRUA?.enregistre_par_id_etablissement &&
              `Location/${patientRUA?.enregistre_par_id_etablissement}`,
            display: patientRUA?.enregistre_par_nom_etablissement,
          },
        },
        {
          url: `${this.extension_url}/RegistrationDate`,
          valueDateTime: patientRUA?.date_creation,
        },
        {
          url: `${this.extension_url}/BloodGroup`,
          valueCoding: {
            system: `${this.codesystem_url}/blood-group-codesystem`,
            code:
              patientRUA?.initial_groupe_sanguin &&
              patientRUA?.initial_groupe_sanguin,
          },
        },
        {
          url: `${this.extension_url}/Electrophoresis`,
          valueCoding: {
            system: `${this.codesystem_url}/electrophorese-codesystem`,
            code:
              patientRUA?.initial_electrophorese &&
              patientRUA?.initial_electrophorese,
          },
        },
        {
          url: `${this.extension_url}/UserReference`,
          valueString: patientRUA?.modifie_par_nom_utilisateur,
        },
      ],
      active: true,
      address: {
        extension: [
          {
            url: `${this.extension_url}/province`,
            valueReference: {
              reference:
                patientRUA?.adresse?.province_id &&
                `Organization/${patientRUA?.adresse?.province_id}`,
            },
          },
          {
            url: `${this.extension_url}/town`,
            valueReference: {
              reference:
                patientRUA?.adresse?.territoire_ville_id &&
                `Organization/${patientRUA?.adresse?.territoire_ville_id}`,
            },
          },
          {
            url: `${this.extension_url}/municipality`,
            valueReference: {
              reference:
                patientRUA?.adresse?.commune_secteur_chefferie_id &&
                `Organization/${patientRUA?.adresse?.commune_secteur_chefferie_id}`,
            },
          },
          {
            url: `${this.extension_url}/neighborhood`,
            valueReference: {
              reference:
                patientRUA?.adresse?.quartier_village_id &&
                `Organization/${patientRUA?.adresse?.quartier_village_id}`,
            },
          },
          {
            url: `${this.extension_url}/street`,
            valueString: patientRUA?.adresse?.avenue,
          },
        ],
      },
      communication: {
        language: [
          {
            coding: [
              {
                system: `${this.valueset_url}/language-valueset`,
                code: patientRUA?.initial_langue,
              },
            ],
          },
        ],
      },
      gender: {
        coding: [
          {
            system: `${this.valueset_url}/gender-valueset`,
            code: patientRUA?.initial_sexe,
          },
        ],
      },
      maritalStatus: {
        coding: [
          {
            system: `${this.valueset_url}/marital-status-valueset`,
            code: patientRUA?.initial_etat_civil,
          },
        ],
      },
    };
    return patientFHIR;
  }

  async ensurePatientExists(id: string, patientRUA: any) {
    const patientUrl = `${this.fhirServerUrl}/Patient/${id}`;
    try {
      // Step 1: Check if Patient already exists
      const foundPatient = await axios.get(patientUrl);
      //throw new ConflictException(`Patient with ID ${id} already exists.`);
    } catch (error) {
      console.log(error);
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        // Step 2: If Not Found (404), create the patient
        const patientFHIR = await this.matchPatientToFHIR(patientRUA);

        console.log(patientFHIR);
        try {
          console.log('Patient not found, creating...');
          const response = await axios.put(patientUrl, patientFHIR);
          console.log(response);
          return response.data; // Return created Location
        } catch (postError) {
          throw new InternalServerErrorException(
            `Failed to create Patient: ${postError.message}`,
          );
        }
      }

      // Handle other errors
      throw new InternalServerErrorException(
        `Error checking Patient: ${error.message}`,
      );
    }
  }
}
