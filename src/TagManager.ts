import {
	App,
	TFile,
} from "obsidian";

// asdasdsa

export class TagManager {

	private app: App;

	/**
	 * 일반적인 태그 목록에서 표시할 수 있는 최대 깊이.
	 *
	 * depth 1:
	 * mushroom
	 *
	 * depth 2:
	 * mushroom/red
	 *
	 * depth 3 이상:
	 * mushroom/red/cap
	 *
	 * 현재 요구사항에서는 depth 3 이상을 표시하지 않는다.
	 */
	private readonly maxVisibleDepth = 2;


	constructor(app: App) {
		this.app = app;
	}


	// ========================================================
	// Normalize
	// ========================================================

	/**
	 * 태그 문자열을 정규화한다.
	 *
	 * "#mushroom" -> "mushroom"
	 * "  mushroom  " -> "mushroom"
	 */
	normalize(tag: string): string {
		return tag
			.trim()
			.replace(/^#+/, "")
			.trim();
	}


	/**
	 * 태그가 유효한지 확인한다.
	 */
	isValid(tag: string): boolean {
		return this.normalize(tag).length > 0;
	}


	// ========================================================
	// Parse
	// ========================================================

	/**
	 * 입력 문자열에서 여러 개의 태그를 추출한다.
	 *
	 * 예:
	 *
	 * "mushroom, red, #fantasy"
	 *
	 * ->
	 *
	 * [
	 *   "mushroom",
	 *   "red",
	 *   "fantasy"
	 * ]
	 */
	parseInput(value: string): string[] {
		const tags = value
			.split(",")
			.map((tag) =>
				this.normalize(tag)
			)
			.filter((tag) =>
				tag.length > 0
			);

		return Array.from(
			new Set(tags)
		);
	}


	/**
	 * 여러 태그를 입력 UI에 표시할 문자열로 변환한다.
	 */
	toInputValue(tags: string[]): string {
		return tags.join(", ");
	}


	// ========================================================
	// Existing Tags
	// ========================================================

	/**
	 * Vault에서 사용되고 있는 모든 태그를 가져온다.
	 *
	 * MetadataCache.getTags()를 사용하기 때문에
	 * frontmatter 뿐만 아니라 Obsidian이 인식하는
	 * 일반적인 태그도 가져올 수 있다.
	 */
    getAllTags(): string[] {
        const tags = new Set<string>();

        const files =
            this.app.vault.getMarkdownFiles();

        for (const file of files) {
            const cache =
                this.app.metadataCache.getFileCache(file);

            const frontmatter =
                cache?.frontmatter;

            if (!frontmatter) {
                continue;
            }

            const value =
                frontmatter.tags;

            if (Array.isArray(value)) {
                for (const tag of value) {
                    if (typeof tag !== "string") {
                        continue;
                    }

                    const normalized =
                        this.normalize(tag);

                    if (normalized) {
                        tags.add(normalized);
                    }
                }
            }
            else if (typeof value === "string") {
                for (const tag of this.parseInput(value)) {
                    tags.add(tag);
                }
            }
        }

        return Array.from(tags)
            .sort((a, b) =>
                a.localeCompare(b)
            );
    }


	/**
	 * 일반 태그 목록에서 표시할 태그만 가져온다.
	 *
	 * depth 3 이상은 제외한다.
	 */
	getVisibleTags(): string[] {
		return this.getAllTags()
			.filter((tag) =>
				this.getDepth(tag)
				<= this.maxVisibleDepth
			);
	}


	// ========================================================
	// Tag Depth
	// ========================================================

	/**
	 * 태그의 깊이를 반환한다.
	 *
	 * mushroom
	 * -> 1
	 *
	 * mushroom/red
	 * -> 2
	 *
	 * mushroom/red/cap
	 * -> 3
	 */
	getDepth(tag: string): number {
		const normalized =
			this.normalize(tag);

		if (!normalized) {
			return 0;
		}

		return normalized
			.split("/")
			.filter((part) =>
				part.length > 0
			)
			.length;
	}


	/**
	 * 일반 목록에서 표시 가능한 태그인지 확인한다.
	 */
	isVisible(tag: string): boolean {
		return (
			this.getDepth(tag)
			<= this.maxVisibleDepth
		);
	}


	// ========================================================
	// Exact Match
	// ========================================================

	/**
	 * 두 태그가 정확히 동일한지 확인한다.
	 *
	 * 하위 태그는 동일한 태그로 취급하지 않는다.
	 *
	 * "mushroom"
	 * "mushroom/red"
	 *
	 * -> false
	 */
	isExactMatch(
		tag: string,
		target: string
	): boolean {
		return (
			this.normalize(tag) ===
			this.normalize(target)
		);
	}


	/**
	 * 태그 배열에 target과 정확히 일치하는
	 * 태그가 존재하는지 확인한다.
	 */
	hasExactTag(
			tags: string[],
			target: string
		): boolean {
			const normalizedTarget =
				this.normalize(target);

			return tags.some((tag) =>
				this.normalize(tag) ===
				normalizedTarget
			);
	}


	// ========================================================
	// Autocomplete
	// ========================================================

	/**
	 * 자동완성 후보를 가져온다.
	 *
	 * 일반적인 표시 깊이 제한을 적용하지 않는다.
	 *
	 * 즉:
	 *
	 * mushroom/red/cap
	 * mushroom/red/cap/large
	 *
	 * 같은 깊은 태그도 자동완성으로 검색할 수 있다.
	 */
	getAutocompleteTags(
		input: string,
		excludedTags: string[] = [],
		limit: number = 10
	): string[] {
		const query =
			this.normalize(input)
				.toLowerCase();

		const excluded =
			new Set(
				excludedTags.map((tag) =>
					this.normalize(tag)
						.toLowerCase()
				)
			);

		if (!query) {
			return [];
		}

		return this.getAllTags()
			.filter((tag) =>
				tag
					.toLowerCase()
					.includes(query)
			)
			.filter((tag) =>
				!excluded.has(
					tag.toLowerCase()
				)
			)
			.slice(0, limit);
	}


	// ========================================================
	// Input
	// ========================================================

	/**
	 * 태그 입력창에서 현재 입력 중인 태그를 가져온다.
	 *
	 * 예:
	 *
	 * "red, mushroom/ch"
	 *
	 * ->
	 *
	 * "mushroom/ch"
	 */
	getCurrentInputTag(
		value: string
	): string {
		const parts =
			value.split(",");

		return this.normalize(
			parts[parts.length - 1] ?? ""
		);
	}


	/**
	 * 자동완성으로 선택한 태그를 기존 입력값에 적용한다.
	 *
	 * 예:
	 *
	 * input:
	 * "red, mush"
	 *
	 * selected:
	 * "mushroom"
	 *
	 * result:
	 * "red, mushroom"
	 */
	replaceCurrentInputTag(
		value: string,
		tag: string
	): string {
		const parts =
			value.split(",");

		parts[parts.length - 1] =
			` ${this.normalize(tag)}`;

		return parts
			.join(",")
			.replace(/^ /, "");
	}


	// ========================================================
	// File Tags
	// ========================================================

	/**
	 * Markdown 파일에서 태그를 가져온다.
	 *
	 * 현재 ClassifyModal에서 직접 구현하고 있는
	 * frontmatter.tags 처리를 TagManager로 이동하기 위한
	 * 메서드다.
	 */
	getFileTags(file: TFile): string[] {
		const cache =
			this.app.metadataCache
				.getFileCache(file);

		const frontmatter =
			cache?.frontmatter;

		if (!frontmatter) {
			return [];
		}

		const value =
			frontmatter.tags;

		const tags: string[] = [];

		if (Array.isArray(value)) {

			for (const tag of value) {
				if (typeof tag !== "string") {
					continue;
				}

				const normalized =
					this.normalize(tag);

				if (normalized) {
					tags.push(normalized);
				}
			}

		} else if (
			typeof value === "string"
		) {

			tags.push(
				...this.parseInput(value)
			);
		}

		return Array.from(
			new Set(tags)
		);
	}


	/**
	 * 파일이 특정 태그를 정확하게 가지고 있는지 확인한다.
	 *
	 * 하위 태그는 일치하지 않는다.
	 *
	 * file tags:
	 * [
	 *   "mushroom",
	 *   "mushroom/red"
	 * ]
	 *
	 * target:
	 * "mushroom"
	 *
	 * -> true
	 *
	 * target:
	 * "mushroom/blue"
	 *
	 * -> false
	 */
	fileHasExactTag(
		file: TFile,
		target: string
	): boolean {
		const tags =
			this.getFileTags(file);

		return this.hasExactTag(
			tags,
			target
		);
	}

	// ========================================================
	// Hierarchical Match
	// ========================================================

	/**
	 * 태그가 target 태그 또는 target의 하위 태그인지 확인한다.
	 *
	 * 예:
	 *
	 * target:
	 * "mushroom"
	 *
	 * tag:
	 * "mushroom"
	 * -> true
	 *
	 * tag:
	 * "mushroom/red"
	 * -> true
	 *
	 * tag:
	 * "mushroom/red/cap"
	 * -> true
	 *
	 * tag:
	 * "mushroom/blue"
	 * -> true
	 *
	 * tag:
	 * "mushroom2"
	 * -> false
	 */
	isHierarchicalMatch(
		tag: string,
		target: string
	): boolean {

		const normalizedTag =
			this.normalize(tag);

		const normalizedTarget =
			this.normalize(target);

		if (
			!normalizedTag ||
			!normalizedTarget
		) {
			return false;
		}

		return (
			normalizedTag === normalizedTarget ||
			normalizedTag.startsWith(
				`${normalizedTarget}/`
			)
		);
	}

	hasHierarchicalTag(
		tags: string[],
		target: string
	): boolean {

		return tags.some((tag) =>
			this.isHierarchicalMatch(
				tag,
				target
			)
		);
	}

	fileHasHierarchicalTag(
		file: TFile,
		target: string
	): boolean {

		const tags =
			this.getFileTags(file);

		return this.hasHierarchicalTag(
			tags,
			target
		);
	}

}