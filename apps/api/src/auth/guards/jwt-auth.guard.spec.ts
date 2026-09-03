import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;
  let superCanActivateSpy: jest.SpyInstance;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
    guard = new JwtAuthGuard(reflector);
    superCanActivateSpy = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);
  });

  afterEach(() => {
    superCanActivateSpy.mockRestore();
  });

  it('returns true when @Public() metadata is set on handler', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(true);
    const ctx = { getHandler: () => ({}), getClass: () => ({}) } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
    expect(superCanActivateSpy).not.toHaveBeenCalled();
  });

  it('calls super.canActivate when not @Public()', () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(false);
    const ctx = { getHandler: () => ({}), getClass: () => ({}) } as unknown as ExecutionContext;
    expect(guard.canActivate(ctx)).toBe(true);
    expect(superCanActivateSpy).toHaveBeenCalledWith(ctx);
  });
});