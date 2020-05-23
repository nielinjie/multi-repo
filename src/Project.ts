import { Dependency } from "./Dep";
import _ from "lodash";
import { sortByDepends } from "./DepTree";
import * as fs from "fs-extra";
import path from "path";
import minimatch from "minimatch";
import { notNil } from "./Util";
import { config } from "./Config";
import { fail } from "assert";
import axios from "axios";
import gitP, { SimpleGit, StatusResult } from "simple-git/promise";
import * as semver from "semver";
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
      const latest = await data?.["dist-tags"]?.["latest"];
      if (latest) {
        return semver.gte(latest, this.version);
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
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
      new CheckTask<boolean>(
        "isWorkingDirClean",
        project.isWorkingDirClean(),
        true
      ),
      new CheckTask<boolean>("isHeadTagged", project.isHeadTagged(), true),
      new CheckTask<boolean>(
        "isNpmRepositoryUpdated",
        this.project.isNpmRepositoryUpdated(),
        true
      ),
      ...project.dependencies
        .map((dependency) => {
          return [
            new CheckTask<boolean>(
              `${dependency.name} - isLink`,
              dependency.isLink(project),
              false
            ),
            new CheckTask<boolean>(
              `${dependency.name} - isVersionSatisfied`,
              dependency.isVersionSatisfied(),
              true
            ),
            new CheckTask<boolean>(
              `${dependency.name} - isVersionNew`,
              dependency.isVersionNew(),
              true
            ),
          ];
        })
        .flat(),
    ];
  }
  all(): Promise<[Task<unknown>, unknown][]> {
    return Promise.all(
      this.tasks.map(
        async (task: Task<unknown>) =>
          [task, await task.task] as [Task<unknown>, unknown]
      )
    );
  }
}

class Task<T> {
  constructor(public name: string, public task: Promise<T>) {}
}
export class CheckTask<T> extends Task<T> {
  check: boolean | undefined = undefined;
  constructor(public name: string, public task: Promise<T>, public wanted: T) {
    super(name, task);
    this.task.then((re) => {
      this.check = re === wanted;
    });
  }
}
