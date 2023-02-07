#!/usr/bin/env node
import { build } from "../esbuild.config";
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
    default: "cjs",
    describe: "Options of the format of the transpiled files",
    type: "string",
    choices: ["cjs", "esm", "iife"],
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
  .help(true)
  .parseSync();

async function run() {
  await new Promise<boolean>((resolve, reject) => {
    build({
      sourceDirectory: options.s,
      outputDirectory: options.o,
      outputFormat: options.f as Format,
      minifying: options.m,
      clearPreviousBuild: options.d,
      verbose: options.v,
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
