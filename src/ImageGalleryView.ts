import {
	ItemView,
	WorkspaceLeaf,
} from "obsidian";

import {
	GallerySettings,
} from "./types";

import ImageCurator from "./main";


export const GALLERY_VIEW_TYPE =
	"image-curator-gallery";


export class ImageGalleryView extends ItemView {

	private plugin: ImageCurator;

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


	private async render() {
		const container =
			this.contentEl;

		container.empty();

		container.addClass(
			"image-curator-gallery-view"
		);

		const assets =
			this.plugin.getAssets();

		const filtered =
			this.plugin.filterAssets(
				assets,
				this.settings
			);

		if (filtered.length === 0) {
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

			columns.push(column);
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

			item.appendChild(image);

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