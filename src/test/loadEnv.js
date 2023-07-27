const path = require('path');
const fs = require('fs');
const d = require('doubter');
const tap = require('tap');
const dotenv = require('dotenv');

const { loadEnv } = require('../../lib');

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

tap.beforeEach(() => {
  process.env.NODE_ENV = 'test';
  delete process.env.DATABASE_URL;
  delete process.env.JWT_SECRET_TOKEN;
});

tap.equal(typeof loadEnv, 'function');

void tap.test('should throw an error when there is no env in process', (t) => {
  delete process.env.NODE_ENV;

  void t.throws(() => loadEnv(schema), new Error('For loading the actual .env defaults file, there is necessary environment in process.env'));

  t.end();
});

void tap.test('should throw an error when there is no core and defaults files', (t) => {
  void t.throws(() => loadEnv(schema), new Error('There are necessary either the core (.env) file or defaults (.env.[environment].defaults) file'));

  t.end();
});

void tap.test('should throw an validation error when .env files don\'t corresponding the schema', (t) => {
  const coreEnvFilePath = path.join(process.cwd(), '.env');

  fs.writeFileSync(coreEnvFilePath,
    `JWT_SECRET_TOKEN=core_super_mega_secret`,
  );

  t.throws(() => loadEnv(schema));

  fs.unlinkSync(coreEnvFilePath);

  t.end();
});

void tap.test('should load environmental variables with core and defaults files', (t) => {
  const coreEnvFilePath = path.join(process.cwd(), '.env');
  const defaultsEnvFilePath = path.join(process.cwd(), '.env.test.defaults');

  fs.writeFileSync(coreEnvFilePath, coreEnvFileContent);
  fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

  loadEnv(schema);

  fs.unlinkSync(coreEnvFilePath);
  fs.unlinkSync(defaultsEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'core.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'core_super_mega_secret');

  t.end();
});

void tap.test('should load environmental variables with only core file', (t) => {
  const coreEnvFilePath = path.join(process.cwd(), '.env');

  fs.writeFileSync(coreEnvFilePath, coreEnvFileContent);

  loadEnv(schema);

  fs.unlinkSync(coreEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'core.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'core_super_mega_secret');

  t.end();
});

void tap.test('should load environmental variables with only defaults file', (t) => {
  const defaultsEnvFilePath = path.join(process.cwd(), '.env.test.defaults');

  fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

  loadEnv(schema);

  fs.unlinkSync(defaultsEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'defaults.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'defaults_super_mega_secret');

  t.end();
});

void tap.test('should load environmental variables mixed up from core and defaults files', (t) => {
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

  t.equal(process.env.DATABASE_URL, 'core.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'defaults_super_mega_secret');

  t.end();
});

void tap.test('should load environmental variables by custom core path', (t) => {
  const coreEnvFilePath = path.join(process.cwd(), '../.env');

  fs.writeFileSync(coreEnvFilePath, coreEnvFileContent);

  loadEnv(schema, { corePath: coreEnvFilePath });

  fs.unlinkSync(coreEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'core.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'core_super_mega_secret');

  t.end();
});

void tap.test('should load environmental variables by custom core path', (t) => {
  const defaultsEnvFilePath = path.join(
    process.cwd(),
    '../.env.test.defaults',
  );

  fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

  loadEnv(schema, { defaultsPathsMap: { test: defaultsEnvFilePath } });

  fs.unlinkSync(defaultsEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'defaults.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'defaults_super_mega_secret');

  t.end();
});

void tap.test('should load environmental variables with custom environment', (t) => {
  process.env.NODE_ENV = 'custom';

  const defaultsEnvFilePath = path.join(
    process.cwd(),
    '.env.custom.defaults',
  );

  fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

  loadEnv(schema);

  fs.unlinkSync(defaultsEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'defaults.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'defaults_super_mega_secret');

  t.end();
});

void tap.test('should load environmental variables with custom environment process variable', (t) => {
  process.env.CUSTOM_ENV = 'custom';

  const defaultsEnvFilePath = path.join(
    process.cwd(),
    '.env.custom.defaults',
  );

  fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

  loadEnv(schema, { processEnvKey: 'CUSTOM_ENV' });

  fs.unlinkSync(defaultsEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'defaults.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'defaults_super_mega_secret');

  t.end();
});

void tap.test('should use dotenv parse function as a custom parser', (t) => {
  const coreEnvFilePath = path.join(process.cwd(), '.env');
  const defaultsEnvFilePath = path.join(process.cwd(), '.env.test.defaults');

  fs.writeFileSync(coreEnvFilePath, coreEnvFileContent);
  fs.writeFileSync(defaultsEnvFilePath, defaultsEnvFileContent);

  loadEnv(schema, { parse: dotenv.parse });

  fs.unlinkSync(coreEnvFilePath);
  fs.unlinkSync(defaultsEnvFilePath);

  t.equal(process.env.DATABASE_URL, 'core.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'core_super_mega_secret');

  t.end();
});

void tap.test('should use custom parse function', (t) => {
  const envFilePath = path.join(process.cwd(), '.env');

  fs.writeFileSync(envFilePath, coreEnvFileContent);

  const customParser = (input) => {
    const parsed = {};
    input.toString().split('\n').forEach((line) => {
      const [key, value] = line.split('=');
      if (key && value) {
        parsed[key.trim()] = value.trim();
      }
    });
    return parsed;
  };

  loadEnv(schema, { parse: customParser });

  fs.unlinkSync(envFilePath);

  t.equal(process.env.DATABASE_URL, 'core.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'core_super_mega_secret');

  t.end();
});

void tap.test('should use custom encoding', (t) => {
  const envFilePath = path.join(process.cwd(), '.env');

  fs.writeFileSync(envFilePath, 'HELLO=привет', { encoding: 'utf8' });

  // The function attempts to load a file using the ASCII encoding, but there is a non-ASCII encoded-word `Привет` in the file.
  // This leads to distortion of the original word, as ASCII can't properly represent characters outside its character set,
  // including the Cyrillic characters used in the word `Привет`.
  loadEnv(d.object({ HELLO: d.string() }), { encoding: 'ascii' });

  fs.unlinkSync(envFilePath);

  // The broken word `Привет` in loaded variable
  t.equal(process.env.HELLO, 'P?Q');

  t.end();
});


void tap.test('should loaded double-quoted variables', (t) => {
  const envFilePath = path.join(process.cwd(), '.env');

  fs.writeFileSync(envFilePath,
    `DATABASE_URL="defaults.database.url"
    JWT_SECRET_TOKEN="defaults_super_mega_secret"`,
  );

  loadEnv(schema);

  fs.unlinkSync(envFilePath);

  t.equal(process.env.DATABASE_URL, 'defaults.database.url');
  t.equal(process.env.JWT_SECRET_TOKEN, 'defaults_super_mega_secret');

  t.end();
});

void tap.test('should not load empty value', (t) => {
  const envFilePath = path.join(process.cwd(), '.env');

  fs.writeFileSync(envFilePath,
    'asd=',
  );

  loadEnv(d.any());

  fs.unlinkSync(envFilePath);

  t.equal(process.env.DATABASE_URL, undefined);
  t.equal(process.env.JWT_SECRET_TOKEN, undefined);

  t.end();
});
