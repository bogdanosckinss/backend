import { IsNotEmpty, IsNumber } from 'class-validator'

export class ProfileDTO {
  @IsNotEmpty()
  image: string

  @IsNotEmpty()
  video: string

  @IsNotEmpty()
  name: string

  @IsNotEmpty()
  lastname: string

  @IsNotEmpty()
  age: number

  @IsNumber()
  @IsNotEmpty()
  phone_number: string

  @IsNotEmpty()
  email: string

  @IsNotEmpty()
  city: string

  @IsNotEmpty()
  social_media_link: string
}
