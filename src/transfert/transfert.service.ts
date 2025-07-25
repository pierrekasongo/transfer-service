import {
  HttpStatus,
  Injectable,
  ConflictException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Status } from 'src/common/enums/status.enum';
import { MercureService } from 'src/mercure/mercure.service';
import { FhirService } from 'src/fhir/fhir.service';
import { ActionEnum } from 'src/common/enums/action.enum';
import { RuaService } from 'src/rua/rua.service';
import { TerritorialeService } from 'src/territoriale/territoriale.service';

@Injectable()
export class TransfertService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly mercureService: MercureService,
    private readonly fhirService: FhirService,
    private readonly ruaService: RuaService,
    private readonly territorialeService: TerritorialeService,
  ) {}
  async create(resource: any) {
    // Flatten resource
    try {
      const createTransfertDto =
        await this.fhirService.flattenResource(resource);

      const { patient_ins } = createTransfertDto;

      const result = await this.ruaService.getPatientByINS(patient_ins);
      if (result) {
        // Check patient
        await this.fhirService.ensurePatientExists(patient_ins, result);
      }

      // Check if there's already an in-progress transfer for the given patient_ins
      const existingTransfer = await this.databaseService.transfert.findFirst({
        where: {
          patient_ins,
          status: Status.TRANSFER_IN_PROGRESS, // Since status is now stored as a string
        },
      });

      // If a transfer is found, return a message instead of creating a new one
      if (existingTransfer) {
        throw new ConflictException(
          `Un transfert est en cours pour ce patient.`,
        );
      }

      // Set default values if needed
      if (!createTransfertDto?.note) {
        createTransfertDto.note = '';
      }

      // Ensure status is set correctly
      createTransfertDto.status = Status.TRANSFER_IN_PROGRESS;

      // Create the transfer
      const newTransfer = await this.databaseService.transfert.create({
        data: { ...createTransfertDto },
      });

      if (newTransfer) {
        // Push to FHIR
        // Get the id from the newly inserted and add it to the resource
        resource.id = newTransfer.id;

        // Make locations array
        const locations = [
          { id: createTransfertDto.source_id, name: createTransfertDto.source },
          {
            id: createTransfertDto.destination_id,
            name: createTransfertDto.destination,
          },
        ];

        for (const loc of locations) {
          // Make sure source location exists
          await this.fhirService.ensureLocationExists(loc.id, loc.name);
        }

        const fhirResult = await this.fhirService.putResource(
          resource,
          ActionEnum.PUT,
        );

        if (fhirResult.status === HttpStatus.CREATED) {
          // Publish to Mercure
          await this.mercureService.publish(
            createTransfertDto.destination_id,
            newTransfer,
          );
        } else {
          // Delete the newly created record from db
          await this.remove(newTransfer.id);
          //return fhirResult;
          throw new NotFoundException(`${fhirResult.message.diagnostics}`);
        }
      }

      return { status: HttpStatus.CREATED, data: newTransfer };
    } catch (error) {
      throw new HttpException(
        `An error occured ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(status?: string, topic?: string, from?: Date, to?: Date) {
    topic = topic?.replaceAll('"', '').replaceAll("'", '').trim();
    status = status?.replaceAll('"', '').replaceAll("'", '').trim();

    if (status === Status.TRANSFER_IN_PROGRESS) {
      const published_data = await this.databaseService.transfert.findMany({
        where: {
          ...(status ? { status: status } : {}),
          ...(topic ? { destination_id: topic } : {}),
          ...(from || to
            ? {
                createdAt: {
                  ...(from ? { gte: new Date(from) } : {}),
                  ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
                },
              }
            : {}),
        },
      });

      // Then publish possibly missed transfers to mercure
      for (const transfer of published_data) {
        await this.mercureService.publish(transfer.destination_id, transfer);
      }
    }
    const data = await this.databaseService.transfert.findMany({
      where: {
        ...(status ? { status: status } : {}),
        ...(topic
          ? { OR: [{ source_id: topic }, { destination_id: topic }] }
          : {}),
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: new Date(from) } : {}),
                ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
              },
            }
          : {}),
      },
    });
    // Get ESS map
    try {
      const essMap = await this.territorialeService.getAllESS();

      // Replace facility names with names from map of key and value
      if (!essMap || essMap.size === 0) {
        console.warn('ESS map is not available, skipping name replacement.');
        return { status: HttpStatus.OK, data: data };
      }

      console.log('ESS map available, replacing names in transfers.');
      for (const transfer of data) {
        if (transfer.source_id && essMap.has(transfer.source_id)) {
          transfer.source = essMap.get(transfer.source_id) ?? transfer.source;
        }
        if (transfer.destination_id && essMap.has(transfer.destination_id)) {
          transfer.destination =
            essMap.get(transfer.destination_id) ?? transfer.destination;
        }
      }
    } catch (error) {
      console.error('Error fetching ESS map:', error);
    }
    return { status: HttpStatus.OK, data: data };
  }

  findOne(id: string) {
    return this.databaseService.transfert.findUnique({
      where: { id },
    });
  }

  async update(id: string, resource: any) {
    //updateTransfertDto: UpdateTransfertDto
    // Flatten resource
    const updateTransfertDto = await this.fhirService.flattenResource(resource);

    const updatedTransfer = await this.databaseService.transfert.update({
      where: { id },
      data: { ...updateTransfertDto },
    });
    if (updatedTransfer) {
      // Update fhir resource
      await this.fhirService.putResource(resource, ActionEnum.PUT);

      // Publish back to mercure to notify the sender
      await this.mercureService.publish(
        updatedTransfer.source_id,
        updatedTransfer,
      );
    }

    return { status: HttpStatus.OK, data: updatedTransfer };
  }

  async remove(id: string) {
    const result = await this.databaseService.transfert.delete({
      where: { id },
    });
    return { status: HttpStatus.OK, data: result };
  }
}
