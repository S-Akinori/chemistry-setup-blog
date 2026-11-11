import type { PluginDescriptor, PortableTextBlockConfig } from "emdash";

export const mathBlock: PortableTextBlockConfig = {
	type: "chemistry.math",
	label: "LaTeX 数式",
	icon: "code",
	category: "学習コンテンツ",
	description: "KaTeXで表示するLaTeX形式の数式を挿入します。",
	fields: [
		{
			type: "text_input",
			action_id: "latex",
			label: "LaTeX",
			placeholder: "例: \\ce{2H2 + O2 -> 2H2O}",
		},
		{
			type: "select",
			action_id: "display",
			label: "表示形式",
			options: [
				{ label: "別行（中央配置）", value: "block" },
				{ label: "文章幅（左配置）", value: "inline" },
			],
		},
		{
			type: "text_input",
			action_id: "caption",
			label: "補足（任意）",
			placeholder: "式の説明や条件",
		},
	],
};

export function mathPlugin(): PluginDescriptor {
	return {
		id: "chemistry-math",
		version: "1.0.0",
		format: "native",
		entrypoint: "./src/plugins/math.runtime.ts",
		portableTextBlocks: [mathBlock],
	};
}

