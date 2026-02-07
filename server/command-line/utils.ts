import _ from "lodash";
import log from "../log";
import colors from "chalk";
import fs from "fs";
import Helper from "../helper";
import Config from "../config";
import path from "path";
import {spawn} from "child_process";
let home: string;

class Utils {
	static extraHelp(this: void) {
		[
			"",
			"Environment variable:",
			`  NEBULA_HOME            Path for all configuration files and folders. Defaults to ${colors.green(
				Helper.expandHome(Utils.defaultHome())
			)}`,
			"",
		].forEach((e) => log.raw(e));
	}

	static defaultHome() {
		if (home) {
			return home;
		}

		const distConfig = Utils.getFileFromRelativeToRoot(".nebula_home");

		home = fs.readFileSync(distConfig, "utf-8").trim();

		return home;
	}

	static getFileFromRelativeToRoot(...fileName: string[]) {
		// e.g. /thelounge/server/command-line/utils.ts
		if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
			return path.resolve(path.join(__dirname, "..", "..", ...fileName));
		}

		// e.g. /thelounge/dist/server/command-line/utils.ts
		return path.resolve(path.join(__dirname, "..", "..", "..", ...fileName));
	}

	// Parses CLI options such as `-c public=true`, `-c debug.raw=true`, etc.
	static parseConfigOptions(this: void, val: string, memo?: any) {
		// Invalid option that is not of format `key=value`, do nothing
		if (!val.includes("=")) {
			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return memo;
		}

		const parseValue = (value: string) => {
			switch (value) {
				case "true":
					return true;
				case "false":
					return false;
				case "undefined":
					return undefined;
				case "null":
					return null;
				default:
					if (/^-?[0-9]+$/.test(value)) {
						// Numbers like port
						return parseInt(value, 10);
					} else if (/^\[.*\]$/.test(value)) {
						// Arrays
						// Supporting arrays `[a,b]` and `[a, b]`
						const array = value.slice(1, -1).split(/,\s*/);

						// If [] is given, it will be parsed as `[ "" ]`, so treat this as empty
						if (array.length === 1 && array[0] === "") {
							return [];
						}

						return array.map(parseValue) as Array<Record<string, string>>; // Re-parses all values of the array
					}

					return value;
			}
		};

		// First time the option is parsed, memo is not set
		if (memo === undefined) {
			memo = {};
		}

		// Note: If passed `-c foo="bar=42"` (with single or double quotes), `val`
		//       will always be passed as `foo=bar=42`, never with quotes.
		const position = val.indexOf("="); // Only split on the first = found
		const key = val.slice(0, position);
		const value = val.slice(position + 1);
		const parsedValue = parseValue(value);

		if (_.has(memo, key)) {
			log.warn(`Configuration key ${colors.bold(key)} was already specified, ignoring...`);
		} else {
			memo = _.set(memo, key, parsedValue);
		}

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return memo;
	}

	static executePackageCommand(command: string, ...parameters: string[]) {
		const packagesPath = Config.getPackagesPath();

		return new Promise((resolve, reject) => {
			let success = false;
			const npm = process.platform === "win32" ? "npm.cmd" : "npm";
			const proc = spawn(npm, [command, "--prefix", packagesPath, ...parameters], {
				env: {
					...process.env,
					NODE_ENV: "production",
				},
			});

			proc.stdout.on("data", (data) => {
				log.debug(data.toString());
				// Basic heuristic for npm success if needed, or just rely on exit code
				success = true;
			});

			proc.stderr.on("data", (data) => {
				log.error(data.toString());
			});

			proc.on("error", (e) => {
				log.error(`${e.message}:`, e.stack || "");
				process.exit(1);
			});

			proc.on("close", (code) => {
				if (code !== 0) {
					return reject(code);
				}

				resolve(true);
			});
		});
	}
}

export default Utils;
