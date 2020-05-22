#!/usr/bin/env node

import path from "path";
import {
  Project,
  projects as getProjects,
} from "./Project";
import { config } from "./Config";
export { Config, config } from "./Config";
export { dependencePath, Dependency } from "./Dep";
export { sortByDepends } from "./DepTree";
export {
  Project,
  dependencies,
  ProjectCheckTask,
  CheckTask,
} from "./Project";



export function projects(basePath: string): Project[] {
  const localPath = path.resolve(process.cwd(), basePath);
  const c = config(localPath);
  //IDEA 1. 检查依赖 ✅
  //IDEA 2. 每个依赖按顺序 ✅
  //IDEA 3. 检查link ✅
  //IDEA 3. 检查version，是否是最新的，是否满足semver ✅
  //IDEA 3. 检查git work tree ✅
  //IDEA 3. 检查git tag: version tag 之后没有提交。✅
  //IDEA 3. 检查npm： npm上的版本同本地——已经publish过了。
  //IDEA 3. 检查docker 如果需要
  //IDEA 3. 检查docker repository 如果需要： repository上的版本同本地。
  //IDEA 4. 检查github，是否有push，可选，不重要。
  //IDEA 做完了检查，再谈处理。
  try {
    const pros = getProjects(basePath);
    return pros;
  } catch (err) {
    console.log(err);
    return [];
  }
}
