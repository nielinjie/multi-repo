import { fail } from "assert";
import { spawnSync, spawn } from "child_process";
import path from "path";
import _ from 'lodash'
export function filterObject(obj: any) {
  const ret: any = {};
  Object.keys(obj)
    .filter((key) => obj[key] !== undefined)
    .forEach((key) => (ret[key] = obj[key]));
  return ret;
}

export function noEnvFound(name: string, help?: string) {
  fail(`env not found - ${name} - ${help ?? ""}`);
}
export const log = require("debug-logger")("quick-qui:create");

export function childProcess(
  command: string,
  args: string[],
  cwd?: string,
  stdinString?: string
) {
    const child = spawn(command, args, {
      cwd: cwd ?? path.resolve(process.cwd()),
      stdio: "inherit",
    });
    if (stdinString) {
      child.stdin?.write(stdinString);
      child.stdin?.end();
    }
    //MARK 如果想把child.stdout 写到 log函数里面 https://stackoverflow.com/questions/49169980/how-to-pipe-to-function-in-node-js
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
    return child;
  }
export function childProcessSync(
  command: string,
  args: string[],
  cwd?: string,
  stdinString?: string
) {
  const done = spawnSync(
    command,
    args,
    filterObject({
      cwd: cwd ?? path.resolve(process.cwd()),
      input: stdinString,
      stdio: "inherit",
    })
  );
  return done;
}

export function notNil<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}