import { build } from "../esbuild.config";

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
