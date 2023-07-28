# exdenv

**exdenv**, a library inspired by tools such as [dotenv](https://www.npmjs.com/package/dotenv) (from which the function
to parse .env files and regular expression was borrowed), and [dotenv-extended](https://www.npmjs.com/package/dotenv-extended),
addresses the challenge of handling environment variables across various development contexts like development,
testing, and production.

While **dotenv-extended** offered helpful features like default environment variables and schema validation, 
it didn't fully address the need for managing unique environment variables across different environments.

**exdenv** resolves this problem by providing a convenient way to handle default environment variables for different situations.
With **exdenv**, you can load environment variables using `.env.[environment].defaults` in combination with the base `.env` file.
This would be a familiar process if you've used **dotenv-extended**, but here added environment-specific defaults.

Here is a typical setup of your files:

### `.env`

The fundamental file specific to the environment, *which shouldn't be committed to the source control*. 

The variables from this file will be loaded with **priority**.

### `.env.[environment].defaults`

This file contains defaults specific to an environment and *should be committed to source control*. 
There can be multiple such files, each corresponding to a particular environment.

**The variables from these files will be loaded if the current environment matches and if
the corresponding variables are either not defined or do not exist in the core [.env](#env) file.** 

### `.env.schema`

**Refer to [Future Updates](#future-updates).**

A JSON schema to validate [.env](#env) and [.env.defaults](#envenvironmentdefaults) files using the **doubter** library. 

Currently, you'll have to provide the **doubter** [schema](#schema) yourself for validation purposes.

## Installation

```shell
npm i --save exdenv
```

or 

```shell
yarn add exdenv
```

## Base usage 

Include the following in your main script as early as possible:

```ts
import * as d from 'doubter';
import { loadEnv } from 'exdenv';

const schema = d.object({
  // ...your validation schema
});

loadEnv(schema);
```

or

```ts
const d = require('doubter');
const { loadEnv } = require('exdenv');

const schema = d.object({
  // ...your validation schema
});

loadEnv(schema);
```

For more detailed examples look at [Real live examples of usage](#real-live-examples-of-usage).

## `loadEnv` signature

```ts
/**
 * Loads environment variables from the .env file and the corresponding .env default file
 * based on the current environment setting.
 *
 * @param {d.AnyShape} schema - A schema object that outlines the structure of the environment variables to be loaded.
 *                              This is used to validate the loaded environment variables.
 * @param {IOptions} [opt] - An optional parameter that defines additional options for loading the environment variables.
 *                           Refer to {@link IOptions} for more details on the options that can be passed.
 * @returns {void} This function doesn't return anything as it directly modifies the process environment variables.
 *
 * @example
 *
 * loadEnv(schema, { 
 *  corePath: path.resolve(process.cwd(), '.env'),
 *  defaultsPathsMap: { 
 *    'test': path.resolve(process.cwd(), '.env.test.defaults'),
 *    'development': path.resolve(process.cwd(), '.env.dev.defaults'),
 *  },
 *  processEnvKey: 'MY_ENV',
 *  parse: dotenv.parse,
 *  encoding: 'utf8',
 * });
 */
export declare function loadEnv(schema: AnyShape, opt?: IOptions): void;
```

## Schema

While [.env.schema](#envschema) implementation is not available yet, 
you can use the **doubter** schema and provide it to the `loadEnv` function as follows:

```ts
import * as d from 'doubter';

const schema = d.object({
  DATABASE_URL: d.string(),
  JWT_SECRET: d.string(),
});

/** You can use it for tiping precess.env */
type IEnv = d.Output<typeof schema>;
```


## Options

```ts
interface IOptions {
  /**
   * Specifies the path to the core .env file.
   *
   * When provided, this file is employed to load the base environment variables.
   * You are free to use any naming scheme that suits your needs.
   *
   * If this path is not specified, the loader defaults to using the '.env' file located in the project's root directory.
   *
   * @default path.resolve(process.cwd(), '.env')
   * @type {string}
   */
  corePath?: string;

  /**
   * This represents a mapping of environment names to paths for the respective .env default files.
   *
   * Each key-value pair in this mapping should represent an environment name (the key, e.g., 'development', 'test', 'production'),
   * and the path to the corresponding .env default file for that environment (the value).
   * This design allows the provision of different default .env files for each specific environment.
   *
   * It is important to note that you are not bound to use standard environment names or adhere strictly to the default
   * environment file naming conventions. Feel free to use any naming scheme that suits your needs.
   *
   * By default, the path to the current environment's .env defaults file is computed as follows:
   * path.resolve(process.cwd(), `.env.${currentEnvironment}.defaults`)
   *
   * @type {Record<string | 'test' | 'development' | 'production', string>}
   */
  defaultsPathsMap?: Record<
    string | 'test' | 'development' | 'production',
    string
  >;

  /**
   * Specifies the key for accessing the process environment.
   *
   * If provided, this key will be utilized to retrieve the process environment variables.
   * This allows you to define which key in the process environment to use to determine the current environment.
   *
   * If it's not specified, the loader defaults to using 'NODE_ENV'.
   *
   * @default 'NODE_ENV'
   * @type {string}
   */
  processEnvKey?: string;

  /**
   * A custom parser function for parsing environment variables from .env files.
   *
   * If provided, this function will be used to parse the environment variables instead of the default parser.
   * This can be useful when you need to handle specific parsing scenarios that are not covered by the default parser.
   *
   * The function should accept either a string or a Buffer object (representing the contents of an .env file) as its argument,
   * and it should return an object where the keys are the names of the environment variables and the values are their corresponding values.
   *
   * The default parser function uses a regular expression from the dotenv library.
   *
   * @type {<Result extends Record<string, string>>(fileContent: string | Buffer) => Result}
   */
  parse?: <Result extends Record<string, string>>(fileContent: string | Buffer) => Result;

  /**
   * Specifies the encoding to use when loading .env files.
   *
   * If provided, the .env files will be read using this encoding. If not provided, the loader defaults to 'utf8'.
   *
   * @default 'utf8'
   * @type {BufferEncoding}
   */
  encoding?: BufferEncoding;
}
```

## Real live examples of usage

### Without the core .env example.

Firstly, create `.env.testing.defaults` and `.env.development.defaults` files at the root of your project.
These files might look like the following:

#### `.env.testing.defaults`

```
DATABASE_URL=postgresql://testuser:password@localhost:5432/testdb
JWT_SECRET=mytestsecret
```

#### `.env.development.defaults`

```
DATABASE_URL=postgresql://devuser:password@localhost:5432/devdb
JWT_SECRET=mydevsecret
```

In these files, `DATABASE_URL` and `JWT_SECRET` are environment variables to be used in the
`testing` and `development` environments respectively.

Now, in your main script, you can use the `loadEnv` function to load these variables as follows:

```ts
import * as d from 'doubter';
import { loadEnv } from 'exdenv';

const schema = d.object({
  DATABASE_URL: d.string(),
  JWT_SECRET: d.string(),
});

loadEnv(schema);

if (process.env.NODE_ENV === 'testing') {
  console.log(process.env.DATABASE_URL); // Outputs: postgresql://testuser:password@localhost:5432/testdb
  console.log(process.env.JWT_SECRET);   // Outputs: mytestsecret
}

if (process.env.NODE_ENV === 'development') {
  console.log(process.env.DATABASE_URL); // Outputs: postgresql://devuser:password@localhost:5432/devdb
  console.log(process.env.JWT_SECRET);   // Outputs: mydevsecret
}
```

Depending on the value of `NODE_ENV`, the appropriate environment variables from `.env.testing.defaults` or
`.env.development.defaults` will be loaded.

If you need to use a different key than `NODE_ENV` to determine the current environment, you can pass this
in the options when calling `loadEnv`, as shown below:

```ts
loadEnv(schema, { processEnvKey: 'MY_ENV' });
```

If you need to specify different paths of `.env` files (e.g., these files located not in root of executing script directory),
you can pass these in the options, as shown below:

```ts
import path from 'path';

loadEnv(schema, {
  corePath: path.resolve(process.cwd(), '../../.env'),
  defaultsPathsMap: {
    testing: path.resolve(process.cwd(), '../../.env.testing.defaults'),
    development: path.resolve(process.cwd(), '../../.env.development.defaults'),
    // ...additional definitions may be present here for any other environments you may need 
  }
});
```

Or maybe you want to use different names for your env files:

```ts
import path from 'path';

loadEnv(schema, {
  corePath: path.resolve(process.cwd(), '../../.base-env'),
  defaultsPathsMap: {
    testing: path.resolve(process.cwd(), '../../.env.testing.def'),
    development: path.resolve(process.cwd(), '../../.env.development.def'),
    // ...additional definitions may be present here for any other environments you may need 
  }
});
```

### Using the core .env file with undefined variables

Firstly, create `.env`, `.env.development.defaults`, and `.env.production.defaults` files at the root of your project.
These files might look as follows:

#### `.env`

```
DATABASE_URL=postgresql://devuser:password@localhost:5432/devdb
```

#### `.env.development.defaults`

```
DATABASE_URL=postgresql://devuser:password@localhost:5432/devdb
JWT_SECRET=mydevsecret
```

#### `.env.production.defaults`

```
DATABASE_URL=postgresql://produser:password@localhost:5432/proddb
JWT_SECRET=prodsecrete
```

In these files, `DATABASE_URL` and `JWT_SECRET` are environment variables that will be used in the `development`
and `production` environments, respectively. However, the core `.env` file, which is loaded with *priority*,
does not define the `JWT_SECRET` variable.

In your main script, use the `loadEnv` function to load these variables as follows:

```ts
import * as d from 'doubter';
import { loadEnv } from 'exdenv';

// The validation for the core .env will pass because any undefined variables will be provided by the default .env file.
const schema = d.object({
  DATABASE_URL: d.string(),
  JWT_SECRET: d.string(),
});

loadEnv(schema);

// This variable is defined in the core .env file and will be loaded regardless of the current environment.
console.log(process.env.DATABASE_URL);   // Outputs: postgresql://devuser:password@localhost:5432/devdb

if (process.env.NODE_ENV === 'production') {
  console.log(process.env.JWT_SECRET);   // Outputs: prodsecrete
}

if (process.env.NODE_ENV === 'development') {
  console.log(process.env.JWT_SECRET);   // Outputs: mydevsecret
}
```

### Usage with a custom parser

You can provide your custom parser function when calling the `loadEnv` function as follows:

```ts
import * as d from 'doubter';
import { loadEnv } from 'exdenv';

const schema = d.object({
  DATABASE_URL: d.string(),
  JWT_SECRET: d.string(),
});

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

// Now, the environment variables will be parsed using your customParser function.
```

In this example, `customParser` is a simple function that parses the .env file content line by line, splitting each line
at the equals sign to get the name and value of each environment variable. Note that this is a simple parser that
doesn't handle complex scenarios, such as quoted values or escaped characters, but it illustrates the basic concept of
how a custom parser function can be used.

### Usage with custom encoding

If your .env files are not in UTF-8 encoding, you can specify the `encoding` when calling the `loadEnv` function:

```ts
import * as d from 'doubter';
import { loadEnv } from 'exdenv';

const schema = d.object({
  DATABASE_URL: d.string(),
  JWT_SECRET: d.string(),
});

loadEnv(schema, { encoding: 'latin1' });

// Now, the .env files will be read using the specified 'latin1' encoding.
```

## Future updates

.env.schema - This feature will be implemented once the `fromJSON` feature is available
in the [@doubter/json-schema](https://www.npmjs.com/package/@doubter/json-schema) library.

## Compatibility

The **exdenv** library is compatible with all stable versions of Node.js starting from version `12.22.12` and onwards. 
For best results and support, it is recommended to use the latest Long Term Support (LTS) version of Node.js. 
