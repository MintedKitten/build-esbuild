import {
  readdirSync,
  statSync,
  existsSync,
  mkdirSync,
  rmSync,
  createReadStream,
  writeFileSync,
  copyFileSync,
} from "fs";
import path, { join } from "path";
import esbuild from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import readline from "readline";
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

export async function build(
  sourceDirectory: string = "src",
  outputDirectory: string = "build",
  outputFormat: esbuild.Format = "esm",
  minifying: boolean = false,
  clearPreviousBuild: boolean = true
) {
  // Options
  const _sourceDirectory: string = sourceDirectory;
  const _outputDirectory: string = outputDirectory;
  const _outputFormat: esbuild.Format = outputFormat;
  const _minifying: boolean = minifying;
  const _clearPreviousBuild: boolean = clearPreviousBuild;

  // Starts by creating empty arrays, and lists all of the affected files
  const entryPoints: string[] = [];
  const folderLookups: string[] = [""];
  const outtypeFormat: string = _outputFormat === "esm" ? "mjs" : "js";
  const otherFiles: string[] = [];
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
  // Create output folder
  const outFolder = join(process.cwd(), _outputDirectory);
  if (existsSync(outFolder)) {
    rmSync(outFolder, { recursive: true });
  }
  mkdirSync(outFolder);
  // Copy all files that don't need to be transpiled
  for (const fileName of otherFiles) {
    const unformatRawFile = path.parse(join(_outputDirectory, fileName));
    const formattedRawFilePath = `${unformatRawFile.dir}/${
      unformatRawFile.name
    }${unformatRawFile.ext !== "" ? `.${unformatRawFile.ext}` : ""}`;
    const originalFilePath = join(_sourceDirectory, fileName);
    copyFileSync(originalFilePath, formattedRawFilePath);
  }
  // Transpiled files
  await esbuild
    .build({
      entryPoints: entryPoints.map((file) => {
        return join(_sourceDirectory, file);
      }),
      outdir: _outputDirectory,
      outExtension: { ".js": `.${outtypeFormat}` },
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
      console.log(res);
    })
    .catch((e) => {
      console.log(e);
    });
  // If output is in ECMAScript, import of local files must be fix
  if (_outputFormat === "esm") {
    await esmUpdateLocalImport(entryPoints)
      .then((r) => {
        console.log(r);
      })
      .catch((er) => {
        console.log("ECMA Fix Error");
        console.log(er);
      });
  }
  async function esmUpdateLocalImport(entryPoints: string[]) {
    for (let index = 0; index < entryPoints.length; index++) {
      const fileName = entryPoints[index];
      let hasUpdateImport = false;
      let correctedLine = "";
      const unformatRawFile = path.parse(join(_outputDirectory, fileName));
      const formattedRawFilePath = `${unformatRawFile.dir}/${unformatRawFile.name}.${outtypeFormat}`;
      await new Promise<boolean>((resolve, reject) => {
        try {
          const reader = readline.createInterface({
            input: createReadStream(formattedRawFilePath).on(
              "error",
              (error) => {
                console.log("Create Read Stream Error");
                console.error(error);
              }
            ),
            crlfDelay: Infinity,
          });
          reader
            .on("line", (rline) => {
              try {
                const codeStructure = Parser.extend(acorn_jsx()).parse(rline, {
                  ecmaVersion: "latest",
                  sourceType: "module",
                }) as unknown as ProgramAcornNode;
                const codeBody = codeStructure.body;
                for (let index = 0; index < codeBody.length; index++) {
                  const codeLine = codeBody[index];
                  try {
                    if (codeLine.type === "ImportDeclaration") {
                      const pathCandidate = rline
                        .substring(
                          codeLine.source.start + 1,
                          codeLine.source.end - 1
                        )
                        .trim();
                      const importPath = join(
                        unformatRawFile.dir,
                        `${pathCandidate}.${outtypeFormat}`
                      );
                      if (existsSync(importPath)) {
                        correctedLine += `${rline.substring(
                          codeLine.start,
                          codeLine.source.end - 1
                        )}.${outtypeFormat}${rline.substring(
                          codeLine.source.end - 1,
                          codeLine.end
                        )}`;
                        hasUpdateImport = true;
                      } else {
                        throw new Error("Import is not local file");
                      }
                    } else {
                      throw new Error("Not an Import statement");
                    }
                  } catch (e) {
                    correctedLine += rline.substring(
                      codeLine.start,
                      codeLine.end
                    );
                  }
                }
              } catch (error) {
                console.log("Parse Error");
                console.log(rline);
              }
            })
            .on("close", () => {
              console.log(`${fileName} has been scanned`);
              resolve(true);
            });
        } catch (e) {
          reject(`Update error on file name: ${fileName}`);
        }
      });
      if (hasUpdateImport) {
        console.log(join(process.cwd(), formattedRawFilePath));
        writeFileSync(formattedRawFilePath, correctedLine, {
          flag: "w",
        });
      }
    }
    return true;
  }
}
