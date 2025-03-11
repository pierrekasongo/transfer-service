import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTransfertDto {
  @IsString()
  @IsNotEmpty()
  source_id: string;

  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  destination_id: string;

  @IsString()
  @IsNotEmpty()
  destination: string;

  @IsString()
  @IsNotEmpty()
  patient_ins: string;

  note: string;

  status: string;
  @IsNotEmpty()
  @IsString()
  user: string;
  createdAt: Date;
  updatedAt: Date;
}
