import {
	ItemView,
	WorkspaceLeaf,
	TFile,
} from "obsidian";

import {
	GallerySettings,
} from "./types";

import {
	TagManager,
} from "./TagManager";

import ImageCurator from "./main";


export const GALLERY_VIEW_TYPE =
	"image-curator-gallery";


export class ImageGalleryView extends ItemView {

	private plugin: ImageCurator;

	private tagManager: TagManager;

	private settings: GallerySettings = {
		tags: [],
		sort: "newest",
		count: 50,
		columns: 4,
	};


	constructor(
		leaf: WorkspaceLeaf,
		plugin: ImageCurator
	) {
		super(leaf);

		this.plugin = plugin;

		this.tagManager =
			new TagManager(this.app);
	}


	getViewType(): string {
		return GALLERY_VIEW_TYPE;
	}


	getDisplayText(): string {
		return "Image Gallery";
	}


	getIcon(): string {
		return "images";
	}


	async onOpen() {
		await this.render();
	}


	async setState(
		state: Record<string, unknown>,
		result: any
	) {
		this.settings = {
			tags:
				Array.isArray(state.tags)
					? state.tags as string[]
					: [],

			sort:
				state.sort === "oldest" ||
				state.sort === "random"
					? state.sort
					: "newest",

			count:
				typeof state.count === "number"
					? state.count
					: 50,

			columns:
				typeof state.columns === "number"
					? state.columns
					: 4,
		};

		await this.render();

		await super.setState(
			state,
			result
		);
	}


	/**
	 * 갤러리 상단의 태그 선택 UI를 생성한다.
	 *
	 * TagManager의 getVisibleTags()를 사용하므로
	 * depth 3 이상의 태그는 표시하지 않는다.
	 */
	private renderTagSelector(
		container: HTMLElement
	): void {

		const tagContainer =
			container.createDiv(
				"image-curator-gallery-tags"
			);

		const title =
			tagContainer.createDiv(
				"image-curator-gallery-tags-title"
			);

		title.setText("Tags");


		const tags =
			tagContainer.createDiv(
				"image-curator-gallery-tag-list"
			);

		const visibleTags =
			this.tagManager.getVisibleTags();


		for (
			const tag of visibleTags
		) {
			const normalizedTag =
				this.tagManager.normalize(tag);

			const selected =
				this.settings.tags.some(
					(selectedTag) =>
						this.tagManager.isExactMatch(
							selectedTag,
							normalizedTag
						)
				);


			const button =
				tags.createEl(
					"button",
					{
						text: normalizedTag,
					}
				);

			button.addClass(
				"image-curator-gallery-tag"
			);

			if (selected) {
				button.addClass(
					"image-curator-gallery-tag-selected"
				);
			}


			button.addEventListener(
				"click",
				async () => {

					this.toggleTag(
						normalizedTag
					);

					await this.render();
				}
			);
		}


		/*
		 * 선택된 태그가 없을 때는
		 * 별도의 제거 버튼을 표시하지 않는다.
		 */
		if (
			this.settings.tags.length === 0
		) {
			return;
		}


		const selectedContainer =
			tagContainer.createDiv(
				"image-curator-gallery-selected-tags"
			);


		const selectedTitle =
			selectedContainer.createSpan();

		selectedTitle.setText(
			"Selected: "
		);


		for (
			const tag
			of this.settings.tags
		) {
			const selectedTag =
				selectedContainer.createEl(
					"button",
					{
						text: tag,
					}
				);

			selectedTag.addClass(
				"image-curator-gallery-selected-tag"
			);


			selectedTag.addEventListener(
				"click",
				async () => {

					this.removeTag(tag);

					await this.render();
				}
			);
		}
	}


	/**
	 * 태그를 선택/해제한다.
	 *
	 * 동일한 태그의 하위 태그를 자동으로
	 * 포함하지 않는다.
	 */
	private toggleTag(
		tag: string
	): void {

		const normalizedTag =
			this.tagManager.normalize(tag);


		const index =
			this.settings.tags.findIndex(
				(selectedTag) =>
					this.tagManager.isExactMatch(
						selectedTag,
						normalizedTag
					)
			);


		if (index >= 0) {
			this.settings.tags.splice(
				index,
				1
			);

			return;
		}


		this.settings.tags.push(
			normalizedTag
		);
	}


	/**
	 * 선택된 태그를 제거한다.
	 */
	private removeTag(
		tag: string
	): void {

		const normalizedTag =
			this.tagManager.normalize(tag);


		this.settings.tags =
			this.settings.tags.filter(
				(selectedTag) =>
					!this.tagManager.isExactMatch(
						selectedTag,
						normalizedTag
					)
			);
	}


	/**
	 * TagManager를 이용해 실제 파일의 태그를
	 * 정확하게 검사한다.
	 *
	 * 예:
	 *
	 * file tags:
	 * [
	 *     "mushroom",
	 *     "mushroom/red"
	 * ]
	 *
	 * 선택:
	 * "mushroom"
	 *
	 * -> true
	 *
	 * 선택:
	 * "mushroom/blue"
	 *
	 * -> false
	 *
	 * "mushroom/red/cap" 역시
	 * "mushroom/red"와 다른 태그이므로 false.
	 */
	private hasSelectedTags(
		file: TFile
	): boolean {

		if (
			this.settings.tags.length === 0
		) {
			return true;
		}


		/*
		 * 여러 태그를 선택한 경우 AND 조건.
		 *
		 * 예:
		 *
		 * ["mushroom", "fantasy"]
		 *
		 * 두 태그를 모두 정확하게 가지고 있어야
		 * 갤러리에 표시된다.
		 */
		return this.settings.tags.every(
			(tag) =>
				this.tagManager.fileHasHierarchicalTag(
					file,
					tag
				)
		);
	}


	/**
	 * asset 목록에 TagManager의 정확한 태그
	 * 필터를 적용한다.
	 */
	private filterByExactTags(
		assets: any[]
	): any[] {

		if (
			this.settings.tags.length === 0
		) {
			return assets;
		}


		return assets.filter(
			(asset) => {

				const note =
					asset.note;

				if (
					!(note instanceof TFile)
				) {
					return false;
				}


				return this.hasSelectedTags(
					note
				);
			}
		);
	}


	private async render() {

		const container =
			this.contentEl;

		container.empty();

		container.addClass(
			"image-curator-gallery-view"
		);


		/*
		 * ----------------------------------------------------
		 * Tag selector
		 * ----------------------------------------------------
		 */

		this.renderTagSelector(
			container
		);


		const assets =
			this.plugin.getAssets();


		/*
		 * 기존 GallerySettings 필터를 먼저 적용한다.
		 */
		let filtered =
			this.plugin.filterAssets(
				assets,
				this.settings
			);

		if (
			filtered.length === 0
		) {

			container.createEl(
				"p",
				{
					text:
						"No matching images.",
				}
			);

			return;
		}


		const gallery =
			container.createDiv(
				"image-curator-masonry"
			);


		gallery.style.setProperty(
			"--image-curator-columns",
			String(
				this.settings.columns
			)
		);


		const columns:
			HTMLDivElement[] = [];


		for (
			let i = 0;
			i < this.settings.columns;
			i++
		) {

			const column =
				gallery.createDiv(
					"image-curator-column"
				);

			columns.push(
				column
			);
		}


		for (
			const asset
			of filtered
		) {

			const image =
				new Image();


			image.src =
				this.app.vault
					.getResourcePath(
						asset.image
					);


			await new Promise<void>(
				(resolve) => {

					image.onload =
						() => resolve();

					image.onerror =
						() => resolve();
				}
			);


			const column =
				this.getShortestColumn(
					columns
				);


			const item =
				column.createDiv(
					"image-curator-item"
				);


			image.alt =
				asset.description ||
				asset.image.basename;


			image.loading =
				"lazy";


			item.appendChild(
				image
			);


			item.addEventListener(
				"click",
				async () => {

					const leaf =
						this.app.workspace
							.getLeaf("tab");


					await leaf.openFile(
						asset.note
					);
				}
			);
		}
	}


	private getShortestColumn(
		columns: HTMLDivElement[]
	): HTMLDivElement {

		const first =
			columns[0];


		if (!first) {
			throw new Error(
				"Gallery has no columns."
			);
		}


		let shortest =
			first;


		for (
			const column
			of columns
		) {

			if (
				column.offsetHeight <
				shortest.offsetHeight
			) {

				shortest =
					column;
			}
		}


		return shortest;
	}


	async onClose() {
		this.contentEl.empty();
	}

}