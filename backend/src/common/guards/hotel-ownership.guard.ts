import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { ActivitiesService } from '../../activities/activities.service';

@Injectable()
export class HotelOwnershipGuard implements CanActivate {
  constructor(@Inject(ActivitiesService) private activitiesService: ActivitiesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // super_admin siempre tiene acceso
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Si es admin, verificar que el hotelId en el JWT coincida con el de la actividad
    if (user.role === Role.ADMIN) {
      const activityId = request.params.id;
      if (!activityId) {
        throw new ForbiddenException('Activity ID not found');
      }

      const activity = await this.activitiesService.findOne(activityId);
      if (!activity) {
        throw new ForbiddenException('Activity not found');
      }

      if (activity.hotelId !== user.hotelId) {
        throw new ForbiddenException('You can only manage activities of your own hotel');
      }

      return true;
    }

    // Los usuarios normales no pueden gestionar actividades
    throw new ForbiddenException('You do not have permission to manage activities');
  }
}
