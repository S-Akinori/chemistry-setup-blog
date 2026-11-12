import type { PortableTextBlock } from "emdash";
import katex from "katex";
import "katex/contrib/mhchem";

interface PortableTextSpan {
	_type: "span";
	_key?: string;
	text: string;
	marks?: string[];
}

type PortableTextNode = PortableTextBlock & {
	children?: PortableTextSpan[];
	markDefs?: Array<Record<string, unknown>>;
};

function isUnescapedDollar(text: string, index: number): boolean {
	if (text[index] !== "$") return false;

	let backslashes = 0;
	for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) {
		backslashes += 1;
	}

	return backslashes % 2 === 0;
}

function isValidInlineMath(latex: string): boolean {
	if (!latex.trim() || latex.includes("\n")) return false;

	try {
		katex.renderToString(latex, {
			displayMode: false,
			throwOnError: true,
			strict: "warn",
			trust: false,
			output: "htmlAndMathml",
		});
		return true;
	} catch {
		return false;
	}
}

function createSpan(
	span: PortableTextSpan,
	text: string,
	index: number,
	mathMarkKey?: string,
): PortableTextSpan {
	return {
		...span,
		_key: `${span._key ?? "span"}-math-${index}`,
		text,
		marks: mathMarkKey
			? [...(span.marks ?? []), mathMarkKey]
			: [...(span.marks ?? [])],
	};
}

function splitInlineMath(
	span: PortableTextSpan,
	registerMath: (key: string, latex: string) => void,
): PortableTextSpan[] {
	const { text } = span;
	if (span.marks?.includes("code") || !text.includes("$")) return [span];

	const result: PortableTextSpan[] = [];
	let plainStart = 0;
	let cursor = 0;
	let partIndex = 0;

	while (cursor < text.length) {
		const isSingleOpening =
			isUnescapedDollar(text, cursor) &&
			text[cursor - 1] !== "$" &&
			text[cursor + 1] !== "$";

		if (!isSingleOpening) {
			cursor += 1;
			continue;
		}

		let closing = cursor + 1;
		while (closing < text.length) {
			if (
				isUnescapedDollar(text, closing) &&
				text[closing - 1] !== "$" &&
				text[closing + 1] !== "$"
			) break;
			closing += 1;
		}

		if (closing >= text.length) break;
		const latex = text.slice(cursor + 1, closing);

		if (!isValidInlineMath(latex)) {
			cursor = closing + 1;
			continue;
		}

		if (cursor > plainStart) {
			result.push(createSpan(span, text.slice(plainStart, cursor).replace(/\\\$/g, "$"), partIndex++));
		}

		const mathMarkKey = `${span._key ?? "span"}-inline-math-${partIndex}`;
		registerMath(mathMarkKey, latex);
		result.push(createSpan(span, latex, partIndex++, mathMarkKey));
		plainStart = closing + 1;
		cursor = closing + 1;
	}

	if (result.length === 0) return [span];
	if (plainStart < text.length) {
		result.push(createSpan(span, text.slice(plainStart).replace(/\\\$/g, "$"), partIndex));
	}

	return result;
}

export function transformInlineMath(value: PortableTextBlock[]): PortableTextBlock[] {
	return value.map((block) => {
		const node = block as PortableTextNode;
		if (node._type !== "block" || !Array.isArray(node.children)) return block;

		const mathMarkDefs: Array<Record<string, unknown>> = [];
		const children = node.children.flatMap((span) =>
			splitInlineMath(span, (key, latex) => {
				mathMarkDefs.push({ _type: "inlineMath", _key: key, latex });
			}),
		);

		return {
			...node,
			children,
			markDefs: [...(node.markDefs ?? []), ...mathMarkDefs],
		};
	});
}
