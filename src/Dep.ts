import * as fs from "fs-extra";
import { Project } from "./Project";
import * as path from "path";
import { notNil } from "./Util";
export function listProject(basePath: string): Project[] {
  const projects= fs
    .readdirSync(basePath)
    .map((fileR) => {
      const file = path.resolve(basePath, fileR);
      if (fs.existsSync(file) && fs.lstatSync(file).isDirectory()) {
        const packagePath = path.resolve(file, "package.json");
        if (fs.existsSync(packagePath)) {
          const packageJson = fs.readJSONSync(packagePath);
          return {
            name: packageJson.name,
            path: file,
            dependencies: Object.keys(packageJson.dependencies ?? {}),
            packageJson,
          } as Project;
        } else return undefined;
      } else return undefined;
    })
    .filter(notNil);

    const names = projects.map(project =>project.name)
    projects.forEach(project =>{
        project.dependencies= project.dependencies.filter(dep=>names.includes(dep) || dep.startsWith('@quick-qui/'))
    })
    return projects
}
