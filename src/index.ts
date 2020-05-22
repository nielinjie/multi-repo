#!/usr/bin/env node

import prog from "caporal";
import path from "path";
import { Project, projects, ProjectCheckTask, CheckTask } from "./Project";
import { config } from "./Config";

prog
  .version("0.1.0")
  .argument("[path]", "path to all repository seat in", prog.STRING)
  .action((args) => {
    const basePath = args["path"] ?? ".";
    const localPath = path.resolve(process.cwd(), basePath);
    const c = config(localPath);
    console.log(c);
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
      const pros = projects(basePath);
      pros.forEach((project: Project) => {
        console.log(project.name);
        console.log(project.dependencies);
      });
      pros.forEach((project) => {
        const task = new ProjectCheckTask(project);
        task.all().then((result) => {
          console.log(`${project.name}`);
          result.forEach((re) => {
            console.log((re[0] as CheckTask<unknown>).name);
            console.log((re[0] as CheckTask<unknown>).check ? "✅" : "⚠️");
          });
        });
      });
    } catch (err) {
      console.log(err);
    }
  });

prog.parse(process.argv);
