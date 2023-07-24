import type { AnyShape } from 'doubter';
import { parse } from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Interface for the options that can be passed to the `loadEnv` function.
 *
 * @interface IOptions
 */
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
}


/**
 * Loads environment variables from the .env file and the corresponding .env default file
 * based on the current environment setting.
 *
 * @param {AnyShape} schema - A schema object that outlines the structure of the environment variables to be loaded.
 *                            This is used to validate the loaded environment variables.
 * @param {IOptions} [opt] - An optional parameter that defines additional options for loading the environment variables.
 *                           Refer to {@link IOptions} for more details on the options that can be passed.
 * @returns {void} This function doesn't return anything as it directly modifies the process environment variables.
 *
 * @example
 *
 * loadEnv(schema, {
 *  corePath: path.resolve(process.cwd(), '.env'),
 *  defaultsPathsMap: {
 *    test: path.resolve(process.cwd(), '.env.test.defaults'),
 *    development: path.resolve(process.cwd(), '.env.dev.defaults'),
 *  },
 *  processEnvKey: 'MY_ENV',
 * });
 */
export function loadEnv(schema: AnyShape, opt?: IOptions): void {
  const currentEnvironment = process.env[opt?.processEnvKey || 'NODE_ENV'];

  if (!currentEnvironment) {
    throw new Error(
      'For loading the actual .env defaults file, there is necessary environment in process.env',
    );
  }

  const coreEnvFilePath = opt?.corePath || path.resolve(process.cwd(), '.env');
  const defaultsEnvFilePath =
    opt?.defaultsPathsMap?.[currentEnvironment] ||
    path.resolve(process.cwd(), `.env.${currentEnvironment}.defaults`);

  const coreEnvFileBuffer = loadFile(coreEnvFilePath);
  const defaultsEnvFileBuffer = loadFile(defaultsEnvFilePath);

  if (!coreEnvFileBuffer && !defaultsEnvFileBuffer) {
    throw new Error(
      'There are necessary either the core (.env) file or defaults (.env.[environment].defaults) file',
    );
  }

  const loadedEnvVariables = Object.assign(
    parse(defaultsEnvFileBuffer || ''),
    parse(coreEnvFileBuffer || ''),
  );

  const parsedEnvVariablesResult = schema.try(loadedEnvVariables);

  if (!parsedEnvVariablesResult.ok) {
    throw new Error(
      `Validation errors: ${parsedEnvVariablesResult.issues
        .map((value) => JSON.stringify(value, null, 2))
        .join('\n')}`,
    );
  }

  Object.assign(process.env, parsedEnvVariablesResult.value);
}

function loadFile(filePath: string): Buffer | undefined {
  try {
    return fs.readFileSync(filePath);
  } catch {
    return undefined;
  }
}
