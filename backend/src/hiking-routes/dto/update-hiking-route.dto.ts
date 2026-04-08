import { PartialType } from '@nestjs/mapped-types';
import { CreateHikingRouteDto } from './create-hiking-route.dto';

export class UpdateHikingRouteDto extends PartialType(CreateHikingRouteDto) {}