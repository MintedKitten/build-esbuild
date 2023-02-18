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
var esbuild_config_exports = {};
__export(esbuild_config_exports, {
  build: () => build
});
module.exports = __toCommonJS(esbuild_config_exports);
var import_fs = require("fs");
var import_path = __toESM(require("path"));
var import_esbuild = __toESM(require("esbuild"));
var import_esbuild_node_externals = require("esbuild-node-externals");
var import_acorn = require("acorn");
var import_acorn_jsx = __toESM(require("acorn-jsx"));
async function build({
  sourceDirectory = "src",
  outputDirectory = "build",
  outputFormat = "esm",
  outputExtension = "mjs",
  minifying = false,
  clearPreviousBuild = true,
  verbose = false
}) {
  const _sourceDirectory = sourceDirectory;
  const _outputDirectory = outputDirectory;
  const _outputFormat = outputFormat;
  const _outtypeFormat = outputExtension;
  const _minifying = minifying;
  const _clearPreviousBuild = clearPreviousBuild;
  console.log("[build-esbuild] Start operation");
  if (verbose) {
    console.log("[build-esbuild] Build with the following options");
    console.log(`[build-esbuild] Source folder: ${_sourceDirectory}`);
    console.log(`[build-esbuild] Output folder: ${_outputDirectory}`);
    console.log(`[build-esbuild] Output format: ${_outputFormat}`);
    console.log(`[build-esbuild] Output Extension: ${_outtypeFormat}`);
    console.log(`[build-esbuild] Minify files: ${_minifying}`);
    console.log(`[build-esbuild] Clear old build: ${_clearPreviousBuild}`);
    console.log(`[build-esbuild] Verbose build: ${verbose}`);
  }
  const entryPoints = [];
  const folderLookups = [""];
  const otherFiles = [];
  if (_clearPreviousBuild) {
    if (verbose) {
      console.log(
        "[build-esbuild] Clear previous build enable. Detecting build folder."
      );
    }
    const outFolder = (0, import_path.join)(process.cwd(), _outputDirectory);
    if ((0, import_fs.existsSync)(outFolder)) {
      if (verbose) {
        console.log(
          "[build-esbuild] Old build folder found. Deleting old build folder."
        );
      }
      (0, import_fs.rmSync)(outFolder, { recursive: true });
    } else {
      if (verbose) {
        console.log("[build-esbuild] Old build folder not found. Proceed.");
      }
    }
    if (verbose) {
      console.log("[build-esbuild] Creating new build folder.");
    }
    (0, import_fs.mkdirSync)(outFolder);
  }
  if (verbose) {
    console.log(
      "[build-esbuild] [Start] Scan files within the source directory"
    );
  }
  for (const folder of folderLookups) {
    (0, import_fs.readdirSync)((0, import_path.join)(process.cwd(), _sourceDirectory, folder)).filter(
      (fileCandidate) => {
        const entryPoint = (0, import_path.join)(folder, fileCandidate);
        const r = (0, import_fs.statSync)((0, import_path.join)(process.cwd(), _sourceDirectory, entryPoint));
        if (r.isFile()) {
          if (fileCandidate.endsWith(".ts") || fileCandidate.endsWith(".tsx")) {
            entryPoints.push((0, import_path.join)(folder, fileCandidate));
          } else {
            otherFiles.push((0, import_path.join)(folder, fileCandidate));
          }
        } else if (r.isDirectory()) {
          folderLookups.push((0, import_path.join)(folder, fileCandidate));
        }
      }
    );
  }
  if (verbose) {
    console.log(
      "[build-esbuild] [Finish] Scanning files within the source directory"
    );
    console.log();
    console.log("[build-esbuild] [List] Files are as follows");
    console.log(`Number of files to transpiled: ${entryPoints.length}`);
    console.log("=== Files to transpiled ===");
    for (const file of entryPoints) {
      console.log(file);
    }
    console.log(`Number of other files to copy: ${otherFiles.length}`);
    console.log("=== Files to copy ===");
    for (const file of otherFiles) {
      console.log(file);
    }
    console.log();
  }
  if (verbose) {
    console.log("[build-esbuild] [Start] Copy other files to output directory");
  }
  try {
    for (const fileName of otherFiles) {
      const unformatRawFile = import_path.default.parse((0, import_path.join)(_outputDirectory, fileName));
      if (!(0, import_fs.existsSync)(unformatRawFile.dir)) {
        (0, import_fs.mkdirSync)(unformatRawFile.dir, { recursive: true });
      }
      const formattedRawFilePath = `${unformatRawFile.dir}/${unformatRawFile.name}${unformatRawFile.ext}`;
      const originalFilePath = (0, import_path.join)(_sourceDirectory, fileName);
      (0, import_fs.copyFileSync)(originalFilePath, formattedRawFilePath);
    }
  } catch (error) {
    console.error(error);
  }
  if (verbose) {
    console.log(
      "[build-esbuild] [Finish] Copy other files to output directory"
    );
  }
  if (verbose) {
    console.log("[build-esbuild] [Start] Transpiled files using esbuild");
  }
  await import_esbuild.default.build({
    entryPoints: entryPoints.map((file) => {
      return (0, import_path.join)(_sourceDirectory, file);
    }),
    outdir: _outputDirectory,
    outExtension: { ".js": `.${_outtypeFormat}` },
    bundle: false,
    sourcemap: false,
    minify: _minifying,
    splitting: false,
    format: _outputFormat,
    platform: "node",
    target: "esnext",
    allowOverwrite: _clearPreviousBuild,
    plugins: [(0, import_esbuild_node_externals.nodeExternalsPlugin)()]
  }).then((res) => {
    if (verbose) {
      console.log("[build-esbuild] esbuild finish with the following result");
      console.log(res);
    }
  }).catch((e) => {
    if (verbose) {
      console.log("[build-esbuild] esbuild error with the following result");
      console.error(e);
    }
  });
  if (verbose) {
    console.log("[build-esbuild] [Finish] Transpiled files using esbuild");
  }
  if (_outputFormat === "esm") {
    if (verbose) {
      console.log(
        `[build-esbuild] Output format is: ${_outputFormat}. Must fix local import.`
      );
    }
    if (verbose) {
      console.log("[build-esbuild] [Start] Fixing local import.");
    }
    await esmUpdateLocalImport(entryPoints).then((r) => {
      if (verbose) {
        console.log(
          "[build-esbuild] Fix local import finish with the result"
        );
        console.log(r);
      }
    }).catch((er) => {
      if (verbose) {
        console.log("[build-esbuild] Fix local import error with the result");
        console.error("ECMA Fix Error");
        console.error(er);
      }
    });
    if (verbose) {
      console.log("[build-esbuild] [Finish] Fixing local import.");
    }
  }
  console.log("[build-esbuild] Finish operation");
  async function esmUpdateLocalImport(entryPoints2) {
    for (let index = 0; index < entryPoints2.length; index++) {
      const fileName = entryPoints2[index];
      let hasUpdateImport = false;
      let correctedLine = "";
      const unformatRawFile = import_path.default.parse((0, import_path.join)(_outputDirectory, fileName));
      const formattedRawFilePath = `${unformatRawFile.dir}/${unformatRawFile.name}.${_outtypeFormat}`;
      if (verbose) {
        console.log(
          `[build-esbuild] [Start] Fix local import on file : ${formattedRawFilePath}`
        );
      }
      const codes = (0, import_fs.readFileSync)(formattedRawFilePath).toString();
      try {
        const codeStructure = import_acorn.Parser.extend((0, import_acorn_jsx.default)()).parse(codes, {
          ecmaVersion: "latest",
          sourceType: "module"
        });
        const codeBody = codeStructure.body;
        for (let index2 = 0; index2 < codeBody.length; index2++) {
          const codeLine = codeBody[index2];
          try {
            if (codeLine.type === "ImportDeclaration") {
              const pathCandidate = codes.substring(codeLine.source.start + 1, codeLine.source.end - 1).trim();
              if (verbose) {
                console.log(`pathCandidate: ${pathCandidate}`);
              }
              const importFilePath = (0, import_path.join)(
                unformatRawFile.dir,
                `${pathCandidate}.${_outtypeFormat}`
              );
              const importDefaultFilePath = (0, import_path.join)(
                unformatRawFile.dir,
                pathCandidate,
                `index.${_outtypeFormat}`
              );
              const importDefaultFileJSPath = (0, import_path.join)(
                unformatRawFile.dir,
                pathCandidate,
                "index.js"
              );
              if ((0, import_fs.existsSync)(importFilePath)) {
                correctedLine += `
${codes.substring(
                  codeLine.start,
                  codeLine.source.end - 1
                )}.${_outtypeFormat}${codes.substring(
                  codeLine.source.end - 1,
                  codeLine.end
                )}`;
                hasUpdateImport = true;
                if (verbose) {
                  console.log(
                    `Import fixed: ${pathCandidate}.${_outtypeFormat}`
                  );
                }
              } else if ((0, import_fs.existsSync)(importDefaultFilePath)) {
                let front = codes.substring(
                  codeLine.start,
                  codeLine.source.end - 1
                );
                if (front[front.length - 1] === "/") {
                  front = front.slice(0, -1);
                }
                correctedLine += `
${front}/index.${_outtypeFormat}${codes.substring(
                  codeLine.source.end - 1,
                  codeLine.end
                )}`;
                hasUpdateImport = true;
                if (verbose) {
                  console.log(
                    `Import fixed: ${pathCandidate[pathCandidate.length - 1] === "/" ? pathCandidate.slice(0, -1) : pathCandidate}/index.${_outtypeFormat}`
                  );
                }
              } else if ((0, import_fs.existsSync)(importDefaultFileJSPath)) {
                throw new Error("Import is default index.js. No fix needed.");
              } else {
                throw new Error("Import is not local file");
              }
            } else {
              throw new Error(
                `Not an Import statement: ${codes.substring(codeLine.start, codeLine.end).trim()}`
              );
            }
          } catch (e) {
            if (verbose) {
              const err = e;
              console.log(err.message);
            }
            correctedLine += "\n" + codes.substring(codeLine.start, codeLine.end);
          } finally {
            if (index2 === 0) {
              correctedLine = correctedLine.trimStart();
            }
          }
        }
      } catch (e) {
        console.error(`Update error on file name: ${fileName}`);
      }
      if (hasUpdateImport) {
        if (verbose) {
          console.log("[build-esbuild] [Finish] Fix local import");
        }
        (0, import_fs.writeFileSync)(formattedRawFilePath, correctedLine, {
          flag: "w"
        });
      } else {
        if (verbose) {
          console.log("[build-esbuild] [Finish] No local import to fix");
        }
      }
    }
    return true;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  build
});
