[![NPM version](https://img.shields.io/npm/v/build-esbuild.svg)](https://www.npmjs.com/package/build-esbuild)

# build-esbuild

Transpiling typescript files and copy every other files in source folder to output folder.
Either install this package as dev dependency, or use it as NPM Package Runner (npx)

## Example
```sh
// Install as dev dependency
npm i build-esbuild
build-esbuild -s src -o dist
// Use NPM Package Runner (npx)
npx build-esbuild --help
npx build-esbuild -s src -o dist
npx build-esbuild -s src -o dist -m
npx build-esbuild -s src -o dist -f esm -x mjs -m true -d true -v true
```

## License

This plugin is issued under the [MIT license](./LICENSE).
