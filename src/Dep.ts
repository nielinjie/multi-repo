import * as fs from "fs-extra";
import { Project, projects } from "./Project";
import * as path from "path";
import * as semver from "semver";
import { fail } from "assert";

export function dependencePath(project: Project, dependence: string): string {
  return path.resolve(project.path, "node_modules", dependence);
}

export class Dependency {
  constructor(public name: string, public version: string) {}
  async isLink(project: Project): Promise<boolean> {
    const pa = dependencePath(project, this.name);
    return (await fs.pathExists(pa)) && (await fs.lstat(pa)).isSymbolicLink();
  }
  async isVersionSatisfied(): Promise<boolean> {
    const findProject = projects().find(
      (project) => project.name === this.name
    );
    const depVersion = findProject?.version;
    return (
      depVersion !== undefined && semver.satisfies(depVersion, this.version)
    );
  }
  async isVersionNew(): Promise<boolean> {
    const findProject = projects().find(
      (project) => project.name === this.name
    );
    const depVersion = findProject?.version;
    return (
      depVersion !== undefined &&
      semver.gte(depVersion, getRangeVersion(this.version))
    );
  }
}

function getRangeVersion(range: string): string {
  if (range.startsWith("^") || range.startsWith("~")) return range.substring(1);
  else fail("only support range started with ~/^");
}
