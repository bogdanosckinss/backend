import { IsNotEmpty } from 'class-validator'

export class CodeDTO {
  @IsNotEmpty()
  name: string

  @IsNotEmpty()
  phone: string
}
