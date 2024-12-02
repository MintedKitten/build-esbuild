import * as dyn from "./dynimp";

export function getHelloName(name: string) {
  if (name === "Admin") {
    name = dyn.adminonly();
  }
  return `Hello ${name}!`;
}
