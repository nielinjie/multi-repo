import { Dependency } from "./Dep";
import _ from "lodash";
import { sortByDepends } from "./DepTree";
import * as fs from "fs-extra";
import path from "path";
import minimatch from "minimatch";
import { notNil } from "./Util";
import { config } from "./Config";
import { fail } from "assert";
import { timeout, TimeoutError } from "promise-timeout";

import axios from "axios";
import gitP, { SimpleGit, StatusResult } from "simple-git/promise";
import * as semver from "semver";
import { CheckTask, Task } from "./CheckTask";
import { Action } from "./Action";
export class Project {
  public name: string;
  public dependencies: Dependency[];
  public version: string;
  constructor(public packageJson: any, public path: string) {
    this.name = packageJson.name;
    this.dependencies = dependencies(this.packageJson);
    this.version = packageJson.version;
  }
  async isWorkingDirClean(): Promise<boolean> {
    const git: SimpleGit = gitP(this.path);
    const status: StatusResult = await git.status();
    return status.files.length === 0;
  }
  async isHeadTagged(): Promise<boolean> {
    const git: SimpleGit = gitP(this.path);
    const latest = (await git.log()).latest;
    const vReg = /tag\s*:\s*v([\d\.]+)\s*/;
    // console.log(latest);
    const refVersion = vReg.exec(latest.refs);
    if (refVersion) {
      const re = refVersion[1];
      return re === this.version;
    }
    return false;
  }
  async isNpmRepositoryUpdated(): Promise<boolean> {
    try {
      const data = await axios
        .get(`http://registry.npmjs.org/${this.name}`)
        .then((re) => re.data);
      //TODO 处理 prerelease 的情况。

      const latest = await data?.["dist-tags"]?.["latest"];
      if (latest) {
        return semver.gte(latest, this.version);
      } else {
        return false;
      }
    } catch (err) {
      throw `when got npm  - a err`;
    }
  }

  async isGitRemoteUpdated(): Promise<boolean> {
    const git: SimpleGit = gitP(this.path);
    const latest = (await git.log()).latest;
    // const vReg = /tag\s*:\s*v([\d\.]+)\s*/;
    // console.log(latest.refs);
    // console.log(latest.refs.indexOf("origin"));
    //TODO 写死了remote名字
    return latest.refs.indexOf("origin") !== -1;
  }
}

export function dependencies(packageJson: any): Dependency[] {
  return _(packageJson.dependencies as object)
    .map((value, key) => {
      return new Dependency(key, value);
    })
    .value();
}

let _projects: Project[] | undefined;

export function projects(basePath?: string): Project[] {
  if (!_projects) _projects = sortByDepends(listProject(basePath!)).reverse();
  return _projects;
}

function listProject(basePath: string): Project[] {
  const projects = fs
    .readdirSync(basePath)
    .map((fileR) => {
      const file = path.resolve(basePath, fileR);
      if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) {
        const packagePath = path.resolve(file, "package.json");
        if (fs.existsSync(packagePath)) {
          const packageJson = fs.readJSONSync(packagePath);
          return new Project(packageJson, file);
        } else return undefined;
      } else return undefined;
    })
    .filter(notNil);

  const includedProjects = projects.filter((project) =>
    config().includes.some((include) => minimatch(project.name, include))
  );
  const names = includedProjects.map((project) => project.name);

  includedProjects.forEach((project) => {
    project.dependencies = project.dependencies.filter((dep) =>
      names.includes(dep.name)
    );
  });
  return includedProjects;
}

export class ProjectCheckTask {
  public tasks: Task<unknown>[];
  constructor(public project: Project) {
    this.tasks = [
      ...this.dependencyTasks(project),
      new CheckTask<boolean>(
        "isWorkingDirClean",
        project.isWorkingDirClean(),
        true,
        [new Action("gitCommit", "git add -A && git commit -m xxx")]
      ),
      new CheckTask<boolean>("isHeadTagged", project.isHeadTagged(), true, [
        new Action("npmVersion", "npm version major/minor/patch"),
      ]),
      new CheckTask<boolean>(
        "isNpmRepositoryUpdated",
        timeout(this.project.isNpmRepositoryUpdated(), 5 * 1000),
        true,
        [new Action("npmPublish", "npm publish")]
      ),

      new CheckTask<boolean>(
        "isGitRemoteUpdated",
        this.project.isGitRemoteUpdated(),
        true,
        [new Action("gitPush", "git push")]
      ),
    ];
  }

  private dependencyTasks(project: Project) {
    return project.dependencies
      .map((dependency) => {
        return [
          new CheckTask<boolean>(
            `${dependency.name} - isLink`,
            dependency.isLink(project),
            false,
            [new Action("npmUpdate", "npm update")]
          ),
          new CheckTask<boolean>(
            `${dependency.name} - isVersionSatisfied`,
            dependency.isVersionSatisfied(),
            true
          ),
          new CheckTask<boolean>(
            `${dependency.name} - isVersionNew`,
            dependency.isVersionNew(),
            true,
            [new Action("npmUpdate", "npm update")]
          ),
        ];
      })
      .flat();
  }
}
