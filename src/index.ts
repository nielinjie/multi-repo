#!/usr/bin/env node

import * as prog from "caporal";
import * as prompts from "prompts";
import * as fs from "fs";
import * as path from "path";
import { questions } from "./variables";
import * as ejs from "ejs";
import * as chalk from "chalk";
import { childProcessSync, log } from "./Util";
import { listProject } from "./Dep";
import { sortByDepends } from "./DepTree";
import { Project } from "./Project";

prog
  .version("0.1.0")
  .argument("[path]", "path to all repository seat in", prog.STRING)
  .action((args) => {
    const basePath = args["path"] ?? ".";
    const localPath = path.resolve(process.cwd(), basePath);
    //IDEA 1. 检查依赖
    //IDEA 2. 每个依赖按顺序
    //IDEA 3. 检查link
    //IDEA 3. 检查npm update
    //IDEA 3. 检查git work tree
    //IDEA 3. 检查git tag
    //IDEA 3. 检查npm
    //IDEA 3. 检查docker 如果需要
    try{
    const projects = listProject(localPath);
    const sorted = sortByDepends(projects);
    sorted.forEach((project: Project) => {
      console.log(project.name);
      console.log(project.dependencies);
    });
  }catch(err) {
    console.log(err)
  }
  });

prog.parse(process.argv);
