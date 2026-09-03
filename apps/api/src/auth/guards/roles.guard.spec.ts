import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new RolesGuard(reflector);
  });

  const makeContext = (user: any): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  };

  it('passes when no @Roles() metadata is set', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    expect(guard.canActivate(makeContext({ id: 'u', email: 'a@b.c', role: UserRole.GUEST }))).toBe(true);
  });

  it('passes when user role matches required roles', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    expect(
      guard.canActivate(makeContext({ id: 'u', email: 'a@b.c', role: UserRole.ADMIN })),
    ).toBe(true);
  });

  it('throws ForbiddenException when user role is not allowed', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      guard.canActivate(makeContext({ id: 'u', email: 'a@b.c', role: UserRole.GUEST })),
    ).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when no user is on the request', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });
});