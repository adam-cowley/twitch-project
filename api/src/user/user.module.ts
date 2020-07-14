import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [EncryptionModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
