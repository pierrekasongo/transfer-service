import { Test, TestingModule } from '@nestjs/testing';
import { RuaService } from './rua.service';

describe('RuaService', () => {
  let service: RuaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RuaService],
    }).compile();

    service = module.get<RuaService>(RuaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
