import esbuild from "esbuild";
export interface buildInterface {
    /**
     * {string} The Source Directory of the original files - Default: src
     */
    sourceDirectory: string;
    /**
     * {string} The Output DIrectory of the transpiled files - Default: build
     */
    outputDirectory: string;
    /**
     * {esbuild.Format} The Output Format of the transpiled files - Default: esm
     */
    outputFormat: esbuild.Format;
    /**
     * {boolean} Option to minify the transpiled files - Default: false
     */
    minifying: boolean;
    /**
     * {boolean} Option to delete the output folder before new build - Default: true
     */
    clearPreviousBuild: boolean;
    /**
     * {boolean} Option to print every steps of the program - Default: false
     */
    verbose?: boolean;
}
/**
 * Transpiled the files within the source firectory to the output directory.
 * @param .sourceDirectory {string} Source directory
 * @param .outputDirectory {string} Output directory
 * @param .outputFormat {esbuild.Format} Output format
 * @param .minifying {boolean} Option to minify
 * @param .clearPreviousBuild {boolean} Option to clear old build
 * @param .verbose {boolean} Option to print each steps
 */
export declare function build({ sourceDirectory, outputDirectory, outputFormat, minifying, clearPreviousBuild, verbose, }: buildInterface): Promise<void>;
