import { IsNotEmpty } from 'class-validator'

export class CodeDTOViaEmail {
  @IsNotEmpty()
  name: string

  @IsNotEmpty()
  email: string
}
