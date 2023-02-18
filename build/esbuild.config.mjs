import {
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  copyFileSync,
  readFileSync
} from "fs";
import path, { join } from "path";
import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { Parser } from "acorn";
import acorn_jsx from "acorn-jsx";
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
    const outFolder = join(process.cwd(), _outputDirectory);
    if (existsSync(outFolder)) {
      if (verbose) {
        console.log(
          "[build-esbuild] Old build folder found. Deleting old build folder."
        );
      }
      rmSync(outFolder, { recursive: true });
    } else {
      if (verbose) {
        console.log("[build-esbuild] Old build folder not found. Proceed.");
      }
    }
    if (verbose) {
      console.log("[build-esbuild] Creating new build folder.");
    }
    mkdirSync(outFolder);
  }
  if (verbose) {
    console.log(
      "[build-esbuild] [Start] Scan files within the source directory"
    );
  }
  for (const folder of folderLookups) {
    readdirSync(join(process.cwd(), _sourceDirectory, folder)).filter(
      (fileCandidate) => {
        const entryPoint = join(folder, fileCandidate);
        const r = statSync(join(process.cwd(), _sourceDirectory, entryPoint));
        if (r.isFile()) {
          if (fileCandidate.endsWith(".ts") || fileCandidate.endsWith(".tsx")) {
            entryPoints.push(join(folder, fileCandidate));
          } else {
            otherFiles.push(join(folder, fileCandidate));
          }
        } else if (r.isDirectory()) {
          folderLookups.push(join(folder, fileCandidate));
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
      const unformatRawFile = path.parse(join(_outputDirectory, fileName));
      if (!existsSync(unformatRawFile.dir)) {
        mkdirSync(unformatRawFile.dir, { recursive: true });
      }
      const formattedRawFilePath = `${unformatRawFile.dir}/${unformatRawFile.name}${unformatRawFile.ext}`;
      const originalFilePath = join(_sourceDirectory, fileName);
      copyFileSync(originalFilePath, formattedRawFilePath);
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
  await esbuild.build({
    entryPoints: entryPoints.map((file) => {
      return join(_sourceDirectory, file);
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
    plugins: [nodeExternalsPlugin()]
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
      const unformatRawFile = path.parse(join(_outputDirectory, fileName));
      const formattedRawFilePath = `${unformatRawFile.dir}/${unformatRawFile.name}.${_outtypeFormat}`;
      if (verbose) {
        console.log(
          `[build-esbuild] [Start] Fix local import on file : ${formattedRawFilePath}`
        );
      }
      const codes = readFileSync(formattedRawFilePath).toString();
      try {
        const codeStructure = Parser.extend(acorn_jsx()).parse(codes, {
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
              const importFilePath = join(
                unformatRawFile.dir,
                `${pathCandidate}.${_outtypeFormat}`
              );
              const importDefaultFilePath = join(
                unformatRawFile.dir,
                pathCandidate,
                `index.${_outtypeFormat}`
              );
              const importDefaultFileJSPath = join(
                unformatRawFile.dir,
                pathCandidate,
                "index.js"
              );
              if (existsSync(importFilePath)) {
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
              } else if (existsSync(importDefaultFilePath)) {
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
              } else if (existsSync(importDefaultFileJSPath)) {
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
        writeFileSync(formattedRawFilePath, correctedLine, {
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
export {
  build
};
