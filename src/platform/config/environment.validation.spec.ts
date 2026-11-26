import { environmentValidationSchema } from './environment.validation';

describe('environmentValidationSchema', () => {
  it('applies safe defaults for optional platform settings', () => {
    const result = environmentValidationSchema.validate({
      NODE_ENV: 'test',
    });

    expect(result.error).toBeUndefined();
    expect(result.value).toMatchObject({
      CORS_ORIGIN: '',
      NODE_ENV: 'test',
      PORT: 3000,
    });
  });

  it('rejects an invalid MongoDB URI', () => {
    const result = environmentValidationSchema.validate({
      MONGODB_URI: 'not-a-mongodb-uri',
    });

    expect(result.error).toBeDefined();
  });

  it('requires production secrets and persistence configuration', () => {
    const result = environmentValidationSchema.validate({
      NODE_ENV: 'production',
    });

    expect(result.error).toBeDefined();
  });
});
