#!/usr/bin/env node
import { build, buildInterface, outputExtension } from "../esbuild.config";
import type { Format } from "esbuild";
import yargs from "yargs";

const scriptname = "build-esbuild";

const usage = `${scriptname} -s <source> -o <output> [options]`;

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
    choices: ["cjs", "esm", "iife"],
    default: "cjs",
    describe: "Options of the format of the transpiled files",
    type: "string",
  })
  .options("x", {
    alias: ["file", "type", "filetype", "ext", "extension", "fileExtension"],
    choices: ["js", "mjs"],
    default: "js",
    describe: "Options of the file extension of the transpiled files",
    type: "string",
  })
  .options("m", {
    alias: ["mn", "minify"],
    default: false,
    describe: "Option to minify the output files",
    type: "boolean",
  })
  .options("d", {
    alias: ["del", "delete", "clear", "clearPreviousBuild"],
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
  .help(true)
  .strict()
  .parseSync();

async function run(options: buildInterface) {
  await new Promise<boolean>((resolve, reject) => {
    build({
      sourceDirectory: options.sourceDirectory,
      outputDirectory: options.outputDirectory,
      outputFormat: options.outputFormat,
      outputExtension: options.outputExtension,
      minifying: options.minifying,
      clearPreviousBuild: options.clearPreviousBuild,
      verbose: options.verbose,
    })
      .then(() => {
        resolve(true);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
run({
  sourceDirectory: options.s,
  outputDirectory: options.o,
  outputFormat: options.f as Format,
  outputExtension: options.x as outputExtension,
  minifying: options.m,
  clearPreviousBuild: options.d,
  verbose: options.v,
});

export { run };
