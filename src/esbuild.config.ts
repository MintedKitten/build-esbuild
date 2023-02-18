import {
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  copyFileSync,
  readFileSync,
} from "fs";
import path, { join } from "path";
import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { Parser } from "acorn";
import acorn_jsx from "acorn-jsx";

// Would love to do the whole thing, but don't have time.
interface DefaultAcornNode {
  type: string;
  start: number;
  end: number;
  [x: string]: any;
}

interface ProgramAcornNode extends DefaultAcornNode {
  type: "Program";
  body: AcornNodes[];
  sourceType: "module" | "script";
}

interface ImportDeclarationAcornNode extends DefaultAcornNode {
  type: "ImportDeclaration";
  specifiers: (ImportDefaultSpecifierAcornNode | ImportSpecifierAcornNode)[];
  source: LiteralAcornNode;
}

interface ImportDefaultSpecifierAcornNode extends DefaultAcornNode {
  type: "ImportDefaultSpecifier";
  local: IdentifierAcornNode;
}

interface LiteralAcornNode extends DefaultAcornNode {
  type: "Literal";
  value: string;
  raw: string;
}

interface IdentifierAcornNode extends DefaultAcornNode {
  type: "Identifier";
  name: string;
}

interface ImportSpecifierAcornNode extends DefaultAcornNode {
  type: "ImportSpecifier";
  imported: IdentifierAcornNode;
  local: IdentifierAcornNode;
}

interface VariableDeclarationAcornNode extends DefaultAcornNode {
  type: "VariableDeclaration";
  declarations: VariableDeclaratorAcornNode[];
  kind: "const" | "var" | "let";
}

interface VariableDeclaratorAcornNode extends DefaultAcornNode {
  type: "VariableDeclarator";
  id: IdentifierAcornNode;
  init: CallExpressionAcornNode;
}

interface CallExpressionAcornNode extends DefaultAcornNode {
  type: "CallExpression";
  optional: boolean;
  callee: IdentifierAcornNode;
  argument: IdentifierAcornNode[];
}

interface FunctionDeclarationAcornNode extends DefaultAcornNode {
  type: "FunctionDeclaration";
  id: IdentifierAcornNode;
  params: IdentifierAcornNode;
  expression: boolean;
  generator: boolean;
  async: boolean;
  body: BlockStatementAcornNode;
}

interface BlockStatementAcornNode extends DefaultAcornNode {
  type: "BlockStatement";
  body: BlockStatementsArrayNode[];
}

interface IfStatementAcornNode extends DefaultAcornNode {
  type: "IfStatement";
  alternate: any;
  test: BinaryExpressionAcornNode;
  consequence: any;
}

interface BinaryExpressionAcornNode extends DefaultAcornNode {
  type: "BinaryExpression";
  operator: string;
}

type BlockStatementsArrayNode =
  | VariableDeclarationAcornNode
  | IfStatementAcornNode;

type AcornNodes =
  | ImportDeclarationAcornNode
  | ImportDefaultSpecifierAcornNode
  | LiteralAcornNode
  | IdentifierAcornNode
  | ImportSpecifierAcornNode
  | VariableDeclarationAcornNode;

export type outputExtension = "js" | "mjs";

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
   * {string} The Output File Extension of the transpiled files - Default: mjs
   */
  outputExtension: outputExtension;
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
export async function build({
  sourceDirectory = "src",
  outputDirectory = "build",
  outputFormat = "esm",
  outputExtension = "mjs",
  minifying = false,
  clearPreviousBuild = true,
  verbose = false,
}: buildInterface) {
  // Options
  const _sourceDirectory: string = sourceDirectory;
  const _outputDirectory: string = outputDirectory;
  const _outputFormat: esbuild.Format = outputFormat;
  const _outtypeFormat: string = outputExtension;
  const _minifying: boolean = minifying;
  const _clearPreviousBuild: boolean = clearPreviousBuild;

  console.log("[build-esbuild] Start operation");

  // Verbose options
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

  // Starts by creating empty arrays, and lists all of the affected files
  const entryPoints: string[] = [];
  const folderLookups: string[] = [""];
  const otherFiles: string[] = [];

  // If clear old build
  if (_clearPreviousBuild) {
    if (verbose) {
      console.log(
        "[build-esbuild] Clear previous build enable. Detecting build folder."
      );
    }

    const outFolder = join(process.cwd(), _outputDirectory);
    // Create output folder
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
  // Copy all files that don't need to be transpiled
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
  // Transpiled files
  await esbuild
    .build({
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
      plugins: [nodeExternalsPlugin()],
    })
    .then((res) => {
      if (verbose) {
        console.log("[build-esbuild] esbuild finish with the following result");
        console.log(res);
      }
    })
    .catch((e) => {
      if (verbose) {
        console.log("[build-esbuild] esbuild error with the following result");
        console.error(e);
      }
    });
  if (verbose) {
    console.log("[build-esbuild] [Finish] Transpiled files using esbuild");
  }

  // If output is in ECMAScript, import of local files must be fix
  if (_outputFormat === "esm") {
    if (verbose) {
      console.log(
        `[build-esbuild] Output format is: ${_outputFormat}. Must fix local import.`
      );
    }
    if (verbose) {
      console.log("[build-esbuild] [Start] Fixing local import.");
    }
    await esmUpdateLocalImport(entryPoints)
      .then((r) => {
        if (verbose) {
          console.log(
            "[build-esbuild] Fix local import finish with the result"
          );
          console.log(r);
        }
      })
      .catch((er) => {
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

  /**
   * Fixing import if output format is in esm (ECMAScript)
   * @param entryPoints {string[]} The paths of files to fix import
   * @returns {Promise<boolean>} Return true if success, otherwise throw an Error.
   */
  async function esmUpdateLocalImport(entryPoints: string[]): Promise<boolean> {
    for (let index = 0; index < entryPoints.length; index++) {
      const fileName = entryPoints[index];
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
        // Try parsing the codes
        const codeStructure = Parser.extend(acorn_jsx()).parse(codes, {
          ecmaVersion: "latest",
          sourceType: "module",
        }) as unknown as ProgramAcornNode;
        // If parsed successfully, read the structure of the code
        const codeBody = codeStructure.body;
        for (let index = 0; index < codeBody.length; index++) {
          const codeLine = codeBody[index];
          try {
            // If the current structure is an import line, scan if import is local then fix the import.
            if (codeLine.type === "ImportDeclaration") {
              // Get the import
              const pathCandidate = codes
                .substring(codeLine.source.start + 1, codeLine.source.end - 1)
                .trim();
              if (verbose) {
                console.log(`pathCandidate: ${pathCandidate}`);
              }
              // Convert to path
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
              // Check if import is local file
              if (existsSync(importFilePath)) {
                // Import is local file. Fix the import path.
                correctedLine += `\n${codes.substring(
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
                // Import is default index.ts. Fix the import path
                // Check if folder import ends with '/'; If true, remove it
                let front = codes.substring(
                  codeLine.start,
                  codeLine.source.end - 1
                );
                if (front[front.length - 1] === "/") {
                  front = front.slice(0, -1);
                }
                correctedLine += `\n${front}/index.${_outtypeFormat}${codes.substring(
                  codeLine.source.end - 1,
                  codeLine.end
                )}`;
                hasUpdateImport = true;
                if (verbose) {
                  console.log(
                    `Import fixed: ${
                      pathCandidate[pathCandidate.length - 1] === "/"
                        ? pathCandidate.slice(0, -1)
                        : pathCandidate
                    }/index.${_outtypeFormat}`
                  );
                }
              } else if (existsSync(importDefaultFileJSPath)) {
                // Import is default index.js. copy.
                throw new Error("Import is default index.js. No fix needed.");
              } else {
                // If import is not local, copy.
                throw new Error("Import is not local file");
              }
            } else {
              // If structure is not import, copy.
              throw new Error(
                `Not an Import statement: ${codes
                  .substring(codeLine.start, codeLine.end)
                  .trim()}`
              );
            }
          } catch (e) {
            // Structure does not need to be fix. Copy to new file.
            if (verbose) {
              const err = e as Error;
              console.log(err.message);
            }
            correctedLine +=
              "\n" + codes.substring(codeLine.start, codeLine.end);
          } finally {
            if (index === 0) {
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
          flag: "w",
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
