import type { AnyShape } from 'doubter';
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
 *  parse: dotenv.parse,
 *  encoding: 'utf8',
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

  const coreEnvFileBuffer = loadFile(coreEnvFilePath, opt?.encoding);
  const defaultsEnvFileBuffer = loadFile(defaultsEnvFilePath, opt?.encoding);

  if (!coreEnvFileBuffer && !defaultsEnvFileBuffer) {
    throw new Error(
      'There are necessary either the core (.env) file or defaults (.env.[environment].defaults) file',
    );
  }

  const actualParse = opt?.parse || parse;

  const loadedEnvVariables = Object.assign(
    actualParse(defaultsEnvFileBuffer || ''),
    actualParse(coreEnvFileBuffer || ''),
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

function loadFile(filePath: string, encoding?: BufferEncoding): Buffer | string | undefined {
  try {
    return fs.readFileSync(filePath, { encoding });
  } catch {
    return undefined;
  }
}

/**
 * A regular expression to parse variable declarations that might include the 'export' modifier and optional comments.
 *
 * @type {RegExp}
 * @property {RegExp}
 * - Starts by looking for the start of a line, possibly followed by whitespace and the 'export' keyword.
 * - Captures a variable identifier, which can consist of alphanumeric characters, underscores, periods, and dashes.
 * - Looks for an equals sign or colon surrounded by any amount of whitespace.
 * - Captures the variable value which might be in single, double, or backticks (with support for escaped quotes within),
 *   or any non-newline or `#` characters. This entire block is optional, which means the variable can be declared without a value.
 * - Looks for an optional comment starting with `#` and continuing to the end of the line, preceded by any amount of whitespace.
 * - Finally, it looks for the end of a line.
 * @property {string} [flags='mg'] - Applies the regular expression to the whole text (m for multiline mode)
 *                                   and finds every match (g for global search).
 */
const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg;

// Parse src into an Object
function parse(src: string | Buffer) {
  const obj: Record<string, string> = {};

  // Convert buffer to string
  let lines = src.toString();

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n');

  let match;
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]!;

    // Default undefined or null to empty string
    let value = (match[2] || '');

    // Remove whitespace
    value = value.trim();

    // Check if double-quoted
    const maybeQuote = value[0];

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2');

    // Expand newlines if double-quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n');
      value = value.replace(/\\r/g, '\r');
    }

    // Add to object
    obj[key] = value;
  }

  return obj;
}
