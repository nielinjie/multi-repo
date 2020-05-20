import { PromptObject } from "prompts";

export const questions: PromptObject[] = [
  {
    type: "text",
    name: "name",
    message: "App Name - "
  },
  {
    type: "text",
    name: "version",
    message: "Version - ",
    initial: "0.0.1"
  },
  {
    type: "text",
    name: "description",
    message: "Description - "
  },
  {
    type: "text",
    name: "author",
    message: "Author - "
  },
  {
    type: "text",
    name: "license",
    message: "License - ",
    initial: "MIT"
  }
];
