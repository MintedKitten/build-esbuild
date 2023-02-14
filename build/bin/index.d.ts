#!/usr/bin/env node
import { buildInterface } from "../esbuild.config";
declare function run(options: buildInterface): Promise<void>;
export { run };
