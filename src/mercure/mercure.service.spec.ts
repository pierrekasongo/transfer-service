import { Test, TestingModule } from '@nestjs/testing';
import { MercureService } from './mercure.service';

describe('MercureService', () => {
  let service: MercureService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MercureService],
    }).compile();

    service = module.get<MercureService>(MercureService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
