import { execFile } from "node:child_process";
import { readFile } from "node:fs";
import utils from "node:util";

export const execFileAsync = utils.promisify(execFile);

export const readFileAsync = utils.promisify(readFile);
