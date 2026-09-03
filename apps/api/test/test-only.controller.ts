/* =============================================================================
 * Test-Only Controller
 * =============================================================================
 * Used solely by auth e2e tests to verify RolesGuard behavior.
 * Not registered in AppModule; mounted only in the test module via
 * `Test.createTestingModule({ controllers: [TestOnlyController] })`.
 * Not part of the production API or Swagger documentation.
 */

import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../src/auth/decorators/roles.decorator';

@Controller({ path: 'test-only', version: '1' })
export class TestOnlyController {
  @Get('admin')
  @Roles(UserRole.ADMIN)
  adminOnly(): { ok: true } {
    return { ok: true };
  }

  @Get('host-or-admin')
  @Roles(UserRole.HOST, UserRole.ADMIN)
  hostOrAdmin(): { ok: true } {
    return { ok: true };
  }
}