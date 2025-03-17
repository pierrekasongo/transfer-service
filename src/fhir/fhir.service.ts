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
    let patientFHIR: any = {
      resourceType: 'Patient',
      id: '',
      extension: [],
      active: true,
      address: { extension: [] },
      communication: { language: [] },
      gender: { coding: [] },
      maritalStatus: { coding: [] },
    };

    patientFHIR.id = patientRUA?.ins;

    // Function to add extension only if value exists
    const addExtension = (url: string, value: any, type: string) => {
      if (value) {
        patientFHIR.extension.push({
          url: `${this.extension_url}/${url}`,
          [type]: value,
        });
      }
    };

    // Add extensions conditionally
    addExtension(
      'Religion',
      {
        system: `${this.codesystem_url}/religion-codesystem`,
        code: patientRUA?.initial_religion,
      },
      'valueCoding',
    );
    addExtension(
      'OriginProvince',
      {
        reference: patientRUA?.province_origine_id
          ? `Organization/${patientRUA.province_origine_id}`
          : undefined,
        display: patientRUA?.province_origine,
      },
      'valueReference',
    );
    addExtension(
      'OriginCity',
      {
        reference: patientRUA?.territoire_ville_origine_id
          ? `Organization/${patientRUA.territoire_ville_origine_id}`
          : undefined,
        display: patientRUA?.territoire_ville_origine,
      },
      'valueReference',
    );
    addExtension(
      'OriginSector',
      {
        reference: patientRUA?.commune_secteur_chefferie_origine_id
          ? `Organization/${patientRUA.commune_secteur_chefferie_origine_id}`
          : undefined,
        display: patientRUA?.commune_secteur_chefferie_origine,
      },
      'valueReference',
    );
    addExtension(
      'Program',
      {
        system: `${this.codesystem_url}/program-codesystem`,
        code: patientRUA?.programmes_personne?.[0]?.initial_programme,
      },
      'valueCoding',
    );
    addExtension('Profession', patientRUA?.profession, 'valueString');
    addExtension(
      'EducationLevel',
      {
        system: `${this.codesystem_url}/education-level-codesystem`,
        code: patientRUA?.initial_niveau_etude,
      },
      'valueCoding',
    );
    addExtension('Company', patientRUA?.compagnie, 'valueString');
    addExtension(
      'IsFormalSector',
      patientRUA?.is_secteur_formel,
      'valueBoolean',
    );
    addExtension(
      'IsPublicCompany',
      patientRUA?.is_compagnie_publique,
      'valueBoolean',
    );
    addExtension('Position', patientRUA?.fonction, 'valueString');
    addExtension('Grade', patientRUA?.grade, 'valueString');
    addExtension(
      'OriginVillage',
      {
        reference: patientRUA?.quartier_village_origine_id
          ? `Organization/${patientRUA.quartier_village_origine_id}`
          : undefined,
        display: patientRUA?.quartier_village_origine,
      },
      'valueReference',
    );
    addExtension(
      'RegistrationChannel',
      patientRUA?.canal_enregistrement,
      'valueString',
    );
    addExtension(
      'EstablishmentReference',
      {
        reference: patientRUA?.enregistre_par_id_etablissement
          ? `Location/${patientRUA.enregistre_par_id_etablissement}`
          : undefined,
        display: patientRUA?.enregistre_par_nom_etablissement,
      },
      'valueReference',
    );
    addExtension(
      'RegistrationDate',
      patientRUA?.date_creation,
      'valueDateTime',
    );
    addExtension(
      'BloodGroup',
      {
        system: `${this.codesystem_url}/blood-group-codesystem`,
        code: patientRUA?.initial_groupe_sanguin,
      },
      'valueCoding',
    );
    addExtension(
      'Electrophoresis',
      {
        system: `${this.codesystem_url}/electrophorese-codesystem`,
        code: patientRUA?.initial_electrophorese,
      },
      'valueCoding',
    );
    addExtension(
      'UserReference',
      patientRUA?.modifie_par_nom_utilisateur,
      'valueString',
    );

    // Address extensions
    const addAddressExtension = (url: string, reference: any) => {
      if (reference) {
        patientFHIR.address.extension.push({
          url: `${this.extension_url}/${url}`,
          valueReference: { reference },
        });
      }
    };

    addAddressExtension(
      'province',
      patientRUA?.adresse?.province_id
        ? `Organization/${patientRUA.adresse.province_id}`
        : undefined,
    );
    addAddressExtension(
      'town',
      patientRUA?.adresse?.territoire_ville_id
        ? `Organization/${patientRUA.adresse.territoire_ville_id}`
        : undefined,
    );
    addAddressExtension(
      'municipality',
      patientRUA?.adresse?.commune_secteur_chefferie_id
        ? `Organization/${patientRUA.adresse.commune_secteur_chefferie_id}`
        : undefined,
    );
    addAddressExtension(
      'neighborhood',
      patientRUA?.adresse?.quartier_village_id
        ? `Organization/${patientRUA.adresse.quartier_village_id}`
        : undefined,
    );
    if (patientRUA?.adresse?.avenue) {
      patientFHIR.address.extension.push({
        url: `${this.extension_url}/street`,
        valueString: patientRUA.adresse.avenue,
      });
    }

    // Communication language
    if (patientRUA?.initial_langue) {
      patientFHIR.communication.language.push({
        coding: [
          {
            system: `${this.valueset_url}/language-valueset`,
            code: patientRUA.initial_langue,
          },
        ],
      });
    }

    // Gender coding
    if (patientRUA?.initial_sexe) {
      patientFHIR.gender.coding.push({
        system: `${this.valueset_url}/gender-valueset`,
        code: patientRUA.initial_sexe,
      });
    }

    // Marital status
    if (patientRUA?.initial_etat_civil) {
      patientFHIR.maritalStatus.coding.push({
        system: `${this.valueset_url}/marital-status-valueset`,
        code: patientRUA.initial_etat_civil,
      });
    }
    return patientFHIR;
  }

  async ensurePatientExists(id: string, patientRUA: any) {
    const patientUrl = `${this.fhirServerUrl}/Patient/${id}`;
    try {
      // Step 1: Check if Patient already exists
      const foundPatient = await axios.get(patientUrl);
      //throw new ConflictException(`Patient with ID ${id} already exists.`);
    } catch (error) {
      if (error.response?.status === HttpStatus.NOT_FOUND) {
        // Step 2: If Not Found (404), create the patient
        const patientFHIR = await this.matchPatientToFHIR(patientRUA);

        try {
          const response = await axios.put(patientFHIR);
          //return response.data; // Return created Location
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
