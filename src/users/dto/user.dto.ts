import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class UserDto {
  @IsNotEmpty()
  @IsNumber()
  id: number

  @IsString()
  public name: string

  @IsString()
  public lastname?: string

  @IsString()
  public email?: string

  @IsNotEmpty()
  @IsString()
  public age?: number

  @IsNotEmpty()
  @IsString()
  public phone_number: string

  @IsString()
  public image?: string

  @IsNotEmpty()
  @IsString()
  public city?: string

  @IsNotEmpty()
  @IsString()
  public social_media_link?: string
}
