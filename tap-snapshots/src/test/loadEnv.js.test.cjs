/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`src/test/loadEnv.js TAP should throw an error when there is no core and defaults files > must match snapshot 1`] = `
[EXDENV] Loading env variables error occurred: there are necessary either the core (.env) file or defaults (.env.[environment].defaults) file
`

exports[`src/test/loadEnv.js TAP should throw an error when there is no env in process > must match snapshot 1`] = `
[EXDENV] Loading env variables error occurred: for loading the actual .env defaults file, there is necessary environment in process.env
`

exports[`src/test/loadEnv.js TAP should throw an validation error when .env files don't corresponding the schema > must match snapshot 1`] = `
[EXDENV] Loading env variables error occurred: validation errors: {
  "code": "type",
  "path": [
    "DATABASE_URL"
  ],
  "message": "Must be a string",
  "param": {
    "name": "string"
  }
}
`
