import { Test, TestingModule } from '@nestjs/testing';
import { TerritorialeService } from './territoriale.service';

describe('TerritorialeService', () => {
  let service: TerritorialeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TerritorialeService],
    }).compile();

    service = module.get<TerritorialeService>(TerritorialeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
