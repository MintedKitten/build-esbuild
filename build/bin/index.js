#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var bin_exports = {};
__export(bin_exports, {
  run: () => run
});
module.exports = __toCommonJS(bin_exports);
var import_esbuild = require("../esbuild.config");
var import_yargs = __toESM(require("yargs"));
const scriptname = "build-esbuild";
const usage = `${scriptname} -s <source> -o <output> [options]`;
const options = import_yargs.default.scriptName(scriptname).usage(usage).options("s", {
  alias: ["src", "source", "srcDir", "sourceDir"],
  demandOption: true,
  default: "src",
  describe: "The source folder",
  type: "string"
}).options("o", {
  alias: ["out", "output", "outDir", "outputDir"],
  demandOption: true,
  default: "build",
  describe: "The output folder",
  type: "string"
}).options("f", {
  alias: ["fmt", "format"],
  default: "cjs",
  describe: "Options of the format of the transpiled files",
  type: "string",
  choices: ["cjs", "esm", "iife"]
}).options("m", {
  alias: ["mn", "minify"],
  default: false,
  describe: "Option to minify the output files",
  type: "boolean"
}).options("d", {
  alias: ["del", "clear", "clearPreviousBuild"],
  default: true,
  describe: "Options to delete the old build folder",
  type: "boolean"
}).options("v", {
  alias: ["verbose"],
  default: false,
  describe: "Options to print steps verbosely",
  type: "boolean"
}).help(true).strict().parseSync();
async function run(options2) {
  await new Promise((resolve, reject) => {
    (0, import_esbuild.build)({
      sourceDirectory: options2.sourceDirectory,
      outputDirectory: options2.outputDirectory,
      outputFormat: options2.outputFormat,
      minifying: options2.minifying,
      clearPreviousBuild: options2.clearPreviousBuild,
      verbose: options2.verbose
    }).then(() => {
      resolve(true);
    }).catch((error) => {
      reject(error);
    });
  });
}
run({
  sourceDirectory: options.s,
  outputDirectory: options.o,
  outputFormat: options.f,
  minifying: options.m,
  clearPreviousBuild: options.d,
  verbose: options.v
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  run
});
