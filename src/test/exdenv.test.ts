import * as path from 'node:path';
import * as fs from 'node:fs';
import * as d from 'doubter';
import * as process from 'node:process';

import { loadEnv } from '../main';

const coreEnvFileContent = `
DATABASE_URL=core.database.url
JWT_SECRET_TOKEN=core_super_mega_secret
`;

const defaultsEnvFileContent = `
DATABASE_URL=defaults.database.url
JWT_SECRET_TOKEN=defaults_super_mega_secret
`;

const schema = d.object({
  DATABASE_URL: d.string(),
  JWT_SECRET_TOKEN: d.string(),
});

beforeEach(() => {
  process.env.NODE_ENV = 'test';
});

describe('Env loading', () => {
  it('should throw an error when there is no env in process', () => {
    delete process.env.NODE_ENV;

    expect(() => loadEnv(schema)).toThrow(
      new Error(
        'For loading the actual .env defaults file, there is necessary environment in process.env',
      ),
    );
  });

  it('should throw an error when there is no core and defaults files', () => {
    expect(() => loadEnv(schema)).toThrow(
      new Error(
        'There are necessary either the core (.env) file or defaults (.env.[environment].defaults) file',
      ),
    );
  });

  it('should load environmental variables with core and defaults files', () => {
    const coreEnvFilePath = path.join(process.cwd(), '.env');
    const defaultsEnvFilePath = path.join(process.cwd(), '.env.test.defaults');

    fs.writeFileSync(coreEnvFilePath, coreEnvFileContent);
    fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

    loadEnv(schema);

    fs.unlinkSync(coreEnvFilePath);
    fs.unlinkSync(defaultsEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('core.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('core_super_mega_secret');
  });

  it('should load environmental variables with only core file', () => {
    const coreEnvFilePath = path.join(process.cwd(), '.env');

    fs.writeFileSync(coreEnvFilePath, coreEnvFileContent);

    loadEnv(schema);

    fs.unlinkSync(coreEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('core.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('core_super_mega_secret');
  });

  it('should load environmental variables with only defaults file', () => {
    const defaultsEnvFilePath = path.join(process.cwd(), '.env.test.defaults');

    fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

    loadEnv(schema);

    fs.unlinkSync(defaultsEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('defaults.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('defaults_super_mega_secret');
  });

  it('should load environmental variables mixed up from core and defaults files', () => {
    const coreEnvFilePath = path.join(process.cwd(), '.env');
    const defaultsEnvFilePath = path.join(process.cwd(), '.env.test.defaults');

    fs.writeFileSync(coreEnvFilePath, 'DATABASE_URL=core.database.url');
    fs.writeFileSync(
      defaultsEnvFilePath,
      `DATABASE_URL=defaults.database.url
            JWT_SECRET_TOKEN=defaults_super_mega_secret`,
    );

    loadEnv(schema);

    fs.unlinkSync(coreEnvFilePath);
    fs.unlinkSync(defaultsEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('core.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('defaults_super_mega_secret');
  });

  it('should load environmental variables by custom core path', () => {
    const coreEnvFilePath = path.join(process.cwd(), '../.env');

    fs.writeFileSync(coreEnvFilePath, coreEnvFileContent);

    loadEnv(schema, { corePath: coreEnvFilePath });

    fs.unlinkSync(coreEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('core.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('core_super_mega_secret');
  });

  it('should load environmental variables by custom core path', () => {
    const defaultsEnvFilePath = path.join(
      process.cwd(),
      '../.env.test.defaults',
    );

    fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

    loadEnv(schema, { defaultsPathsMap: { test: defaultsEnvFilePath } });

    fs.unlinkSync(defaultsEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('defaults.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('defaults_super_mega_secret');
  });

  it('should load environmental variables with custom environment', () => {
    process.env.NODE_ENV = 'custom';

    const defaultsEnvFilePath = path.join(
      process.cwd(),
      '.env.custom.defaults',
    );

    fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

    loadEnv(schema);

    fs.unlinkSync(defaultsEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('defaults.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('defaults_super_mega_secret');
  });

  it('should load environmental variables with custom environment process variable', () => {
    process.env.CUSTOM_ENV = 'custom';

    const defaultsEnvFilePath = path.join(
      process.cwd(),
      '.env.custom.defaults',
    );

    fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

    loadEnv(schema, { processEnvKey: 'CUSTOM_ENV' });

    fs.unlinkSync(defaultsEnvFilePath);

    expect(process.env.DATABASE_URL).toBe('defaults.database.url');
    expect(process.env.JWT_SECRET_TOKEN).toBe('defaults_super_mega_secret');
  });
});
