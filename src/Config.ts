import * as path from "path";
import * as fs from "fs-extra";
import assert = require("assert");
export let _config: Config | undefined = undefined;

export interface Config {
  basePath: string;
  includes: string[];
}

export function config(basePath?: string): Config {
  if (_config === undefined) {
    assert(basePath);
    _config = { basePath, ...loadConfig(basePath!) } as Config;
  }
  return _config;
}
function loadConfig(basePath: string): Partial<Config> {
  assert(basePath !== undefined);
  const configJSONPath = path.resolve(
    process.cwd(),
    basePath,
    "multi-repo.json"
  );
  if (fs.existsSync(configJSONPath)) {
    return { basePath, includes: [], ...fs.readJSONSync(configJSONPath) };
  } else return { basePath };
}
