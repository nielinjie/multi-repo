import * as path from "path";
import * as fs from "fs-extra";
export let _config: Config | undefined = undefined;

export interface Config {
  basePath: string;
  includes?: string;
}

export function config(basePath?: string): Config {
  return _config ?? ({ basePath, ...loadedConfig(basePath!) } as Config);
}
function loadedConfig(basePath: string): Partial<Config> {
  const configJSONPath = path.resolve(
    process.cwd(),
    basePath,
    "multi-repo.json"
  );
  if (fs.existsSync(configJSONPath)) {
    return { basePath, ...fs.readJSONSync(configJSONPath) };
  } else return { basePath };
}
