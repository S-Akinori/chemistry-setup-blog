import { definePlugin } from "emdash";
import { mathBlock } from "./math";

export function createPlugin() {
	return definePlugin({
		id: "chemistry-math",
		version: "1.0.0",
		admin: {
			portableTextBlocks: [mathBlock],
		},
	});
}

