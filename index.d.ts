/**
 * This function takes all files (in 3rd parameter) and effectively utilizes worker threads to get all of your code prepared as soon as possible.
 * @param inputDir directory, which is 'compiled'
 * @param outputDir directory, to whichfiles are 'compiled'
 * @param filesToMinify array of filepaths, relative ot inputDir. will be created in same nested dirs and same names as is in inputDir.
 */
export function minifyFolder(
  inputDir: string,
  outputDir: string,
  filesToMinify: string[]
): Promise<any>;
/**
 * remove code in a single file
 * @param input ABSOLUTE path to input file
 * @param output ABSOLUTE path to output file
 */
export function minifyFile(
  input: string,
  output: string
): Promise<Error | string>;
