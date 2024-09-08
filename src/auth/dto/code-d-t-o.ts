import { IsNotEmpty, IsNumber } from 'class-validator'

export class CodeDTO {
  @IsNotEmpty()
  name: string

  @IsNumber()
  @IsNotEmpty()
  email: string
}
