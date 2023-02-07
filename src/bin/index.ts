import { build } from "../esbuild.config";
import yargs from "yargs";

const scriptname = "build-esbuild";

const usage = `${scriptname} --source=<src> --output=<output> [options]`;

const options = yargs
  .scriptName(scriptname)
  .usage(usage)
  .options("s", {
    alias: ["src", "source", "srcDir", "sourceDir"],
    demandOption: true,
    default: "src",
    describe: "The source folder",
    type: "string",
  })
  .options("o", {
    alias: ["out", "output", "outDir", "outputDir"],
    demandOption: true,
    default: "build",
    describe: "The output folder",
    type: "string",
  })
  .options("f", {
    alias: ["fmt", "format"],
    default: "cjs",
    describe: "Options of the format of the transpiled files",
    type: "string",
  })
  .options("m", {
    alias: ["mn", "minify"],
    default: false,
    describe: "Option to minify the output files",
    type: "boolean",
  })
  .options("d", {
    alias: ["del", "clear", "clearPreviousBuild"],
    default: true,
    describe: "Options to delete the old build folder",
    type: "boolean",
  })
  .options("v", {
    alias: ["verbose"],
    default: false,
    describe: "Options to print steps verbosely",
    type: "boolean",
  })
  .help(true).argv;

async function run() {
  await new Promise<boolean>((resolve, reject) => {
    build({
      sourceDirectory: "src",
      outputDirectory: "build",
      outputFormat: "cjs",
      minifying: false,
      clearPreviousBuild: true,
      verbose: false,
    })
      .then(() => {
        resolve(true);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
run();
