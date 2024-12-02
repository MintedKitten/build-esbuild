import { readdirSync } from "fs";

export function adminonly() {
  const ds = readdirSync(".");
  return "John";
}
