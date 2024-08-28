import { IsNotEmpty, IsNumber } from 'class-validator'

export class CodeDTO {
  @IsNotEmpty()
  name: string

  @IsNumber()
  @IsNotEmpty()
  phone_number: string
}
