import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CampusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  city: string;
}

export class DegreeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  level: number;
}

export class ProgramResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  department: string;
}

export class DegreeProgramResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  degree_id: string;

  @ApiProperty()
  program_id: string;

  @ApiProperty()
  campus_id: string;

  @ApiProperty()
  label: string;
}
