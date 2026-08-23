import { AllExceptionsFilter } from './all-exceptions.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  function createMockHost(url: string): ArgumentsHost {
    const response = { status: statusMock, json: jsonMock };
    const request = { url };
    return {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
    } as unknown as ArgumentsHost;
  }

  it('should format HttpException with status and error code', () => {
    const host = createMockHost('/api/v1/test');
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const responseArg = jsonMock.mock.calls[0][0];
    expect(responseArg.success).toBe(false);
    expect(responseArg.error.code).toBe('NOT_FOUND');
    expect(responseArg.error.message).toBe('Not found');
    expect(responseArg.path).toBe('/api/v1/test');
    expect(responseArg.timestamp).toBeDefined();
  });

  it('should format ValidationError as VALIDATION_ERROR with details', () => {
    const host = createMockHost('/api/v1/users');
    const exception = new HttpException(
      { message: ['email must be an email', 'password too short'], error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const responseArg = jsonMock.mock.calls[0][0];
    expect(responseArg.error.code).toBe('VALIDATION_ERROR');
    expect(responseArg.error.details).toHaveLength(2);
  });

  it('should format generic errors as INTERNAL_SERVER_ERROR', () => {
    const host = createMockHost('/api/v1/test');
    const error = new Error('Something went wrong');

    filter.catch(error, host);

    expect(statusMock).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const responseArg = jsonMock.mock.calls[0][0];
    expect(responseArg.success).toBe(false);
    expect(responseArg.error.code).toBe('INTERNAL_SERVER_ERROR');
  });
});