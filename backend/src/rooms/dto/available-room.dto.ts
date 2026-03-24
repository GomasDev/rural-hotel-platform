// dto/available-room.dto.ts
export class AvailableRoomDto {
  id: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  totalPrice: number;
  availableNights: number;
}
