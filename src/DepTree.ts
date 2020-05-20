import * as toposort from "toposort";
import { notNil } from "./Util";
import { Project } from "./Project";
export function sortByDepends(projects: Project[]): Project[] {
  const pairs: [string, string][] = projects
    .map((project) => {
      return project.dependencies.map((dep) => {
        return [project.name, dep];
      });
    })
    .flat()
    .map((a) => [a[0], a[1]]);
  const sorted: string[] = toposort(pairs);
  return sorted
    .map((name) => projects.find((project) => project.name === name))
    .filter(notNil) as Project[];
}

