import * as d from 'doubter';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

/**
 * Interface for the options that can be passed to the `loadEnv` function.
 *
 * @interface IOptions
 */
interface IOptions {
  /**
   * Path to the core .env file.
   *
   * If provided, this file will be used to load base environment variables.
   *
   * @default path.resolve(process.cwd(), '.env')
   * @type {string}
   */
  corePath?: string;

  /**
   * Mapping of environment names to paths for .env default files.
   *
   * The key should be the name of the environment (e.g., 'development', 'test', 'production'),
   * and the value should be the path to the corresponding .env file for that environment.
   * This allows you to have different .env files for different environments.
   *
   * By default, the current environmental .env defaults file path calculates like this:
   * ``path.resolve(process.cwd(), `.env.${currentEnvironment}.defaults`)``
   *
   * @type {Record<string | 'test' | 'development' | 'production', string>}
   */
  defaultsPathsMap?: Record<
    string | 'test' | 'development' | 'production',
    string
  >;

  /**
   * Key for accessing the process environment.
   *
   * If provided, this key will be used to access the process environment variables.
   *
   * @default NODE_ENV
   * @type {string}
   */
  processEnvKey?: string;
}


/**
 * Loads environmental variables from a .env file and a default .env file,
 * corresponding to the current environment.
 *
 * This function is responsible for merging environment-specific variables
 * with default variables and exposing them for use in your application.
 *
 * It's helpful for managing configurations that change between different environments
 * (like development, testing, and production).
 *
 * @function loadEnv
 * @param {d.AnyShape} schema - The schema object that describes the shape of the environment variables.
 * @param {IOptions} [opt] - Optional parameter that specifies additional options.
 * @see {@link IOptions} for more information about what can be passed as options.
 * @returns {void} No return value. This function modifies the environment variables in-place.
 */
export function loadEnv(schema: d.AnyShape, opt?: IOptions): void {
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
    dotenv.parse(defaultsEnvFileBuffer || ''),
    dotenv.parse(coreEnvFileBuffer || ''),
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
