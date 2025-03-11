import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ActionEnum } from 'src/common/enums/action.enum';

@Injectable()
export class FhirService {
  constructor(private readonly configService: ConfigService) {}
  private fhirServerUrl = this.configService.get<string>('FHIR_URL');
  private fhirExtensionUri = this.configService.get<string>('EXTENSION_URI');
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
}
