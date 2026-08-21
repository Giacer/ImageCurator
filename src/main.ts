import {
	Plugin,
	TFile,
} from "obsidian";

import {
	DEFAULT_SETTINGS,
	ImageCuratorSettings,
	SampleSettingTab,
} from "./settings";

import {
	GallerySettings,
	ImageAsset,
} from "./types";

import {
	ClassifyModal,
} from "./ClassifyModal";

import {
	GallerySettingsModal,
} from "./GallerySettingsModal";

import {
	ImageGalleryView,
	GALLERY_VIEW_TYPE,
} from "./ImageGalleryView";


export default class ImageCurator extends Plugin {

	settings!: ImageCuratorSettings;

	async onload() {
		await this.loadSettings();

		// ====================================================
		// Ribbon
		// ====================================================

		this.addRibbonIcon(
			"images",
			"Open Gallery",
			() => {
				new GallerySettingsModal(
					this.app,
					this
				).open();
			}
		);

		// ====================================================
		// Gallery View
		// ====================================================

		this.registerView(
			GALLERY_VIEW_TYPE,
			(leaf) =>
				new ImageGalleryView(
					leaf,
					this
				)
		);

		// ====================================================
		// File Menu
		// ====================================================

		this.registerEvent(
			this.app.workspace.on(
				"file-menu",
				(menu, file) => {
					if (!(file instanceof TFile)) {
						return;
					}

					if (!this.isImage(file)) {
						return;
					}

					menu.addItem(
						(item) => {
							item
								.setTitle(
									"Classify Image"
								)
								.setIcon(
									"image-upscale"
								)
								.onClick(
									() => {
										console.log(
											"[ImageCurator] settings.assetFolder =",
											this.settings.assetFolder
										);

										new ClassifyModal(
											this.app,
											file,
											this.settings.assetFolder,
											this.settings.noteFolder
										).open();
									}
								);
						}
					);
				}
			)
		);

		// ====================================================
		// Command
		// ====================================================

		this.addCommand({
			id: "open-image-gallery",
			name: "Open Image Gallery",
			callback: () => {
				new GallerySettingsModal(
					this.app,
					this
				).open();
			},
		});

		// ====================================================
		// Settings
		// ====================================================

		this.addSettingTab(
			new SampleSettingTab(
				this.app,
				this
			)
		);
	}

	// ========================================================
	// Gallery
	// ========================================================

	async openGallery(
		settings: GallerySettings
	) {
		const leaf =
			this.app.workspace.getLeaf("tab");

		await leaf.setViewState({
			type: GALLERY_VIEW_TYPE,
			active: true,
			state:
				settings as unknown as
					Record<string, unknown>,
		});

		this.app.workspace.revealLeaf(leaf);
	}

	// ========================================================
	// Get Assets
	// ========================================================

	getAssets(): ImageAsset[] {
		const assets: ImageAsset[] = [];
		const usedImages = new Set<string>();
		const files =
			this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache =
				this.app.metadataCache.getFileCache(
					file
				);

			if (!cache?.frontmatter) {
				continue;
			}

			if (
				cache.frontmatter.type !==
				"image-asset"
			) {
				continue;
			}

			const embed =
				cache.embeds?.find(
					(embed) =>
						this.isImagePath(
							embed.link
						)
				);

			if (!embed) {
				continue;
			}

			const image =
				this.app.metadataCache
					.getFirstLinkpathDest(
						embed.link,
						file.path
					);

			if (
				!image ||
				!(image instanceof TFile)
			) {
				continue;
			}

			if (usedImages.has(image.path)) {
				continue;
			}

			usedImages.add(image.path);

			assets.push({
				note: file,
				image: image,
				date:
					String(
						cache.frontmatter.date ??
						""
					),
				description:
					String(
						cache.frontmatter
							.description ??
						""
					),
				tags:
					this.normalizeTags(
						cache.frontmatter.tags
					),
			});
		}

		return assets;
	}

	// ========================================================
	// Filter
	// ========================================================

	filterAssets(
		assets: ImageAsset[],
		settings: GallerySettings
	): ImageAsset[] {
		let result = [...assets];

		if (settings.tags.length > 0) {
			result =
				result.filter(
					(asset) =>
						settings.tags.every(
							(tag) =>
								asset.tags.includes(
									tag
								)
						)
				);
		}

		switch (settings.sort) {
			case "newest":
				result.sort(
					(a, b) =>
						b.date.localeCompare(
							a.date
						)
				);
				break;

			case "oldest":
				result.sort(
					(a, b) =>
						a.date.localeCompare(
							b.date
						)
				);
				break;

			case "random":
				for (
					let i = result.length - 1;
					i > 0;
					i--
				) {
					const j =
						Math.floor(
							Math.random() *
							(i + 1)
						);

					const a = result[i];
					const b = result[j];

					if (
						a === undefined ||
						b === undefined
					) {
						continue;
					}

					result[i] = b;
					result[j] = a;
				}
				break;
		}

		if (settings.count > 0) {
			result =
				result.slice(
					0,
					settings.count
				);
		}

		return result;
	}

	// ========================================================
	// Image
	// ========================================================

	isImage(file: TFile): boolean {
		return [
			"png",
			"jpg",
			"jpeg",
			"webp",
			"gif",
			"bmp",
			"svg",
		].includes(
			file.extension.toLowerCase()
		);
	}

	isImagePath(path: string): boolean {
		const extension =
			path
				.split(".")
				.pop()
				?.toLowerCase();

		return !!extension &&
			[
				"png",
				"jpg",
				"jpeg",
				"webp",
				"gif",
				"bmp",
				"svg",
			].includes(extension);
	}

	// ========================================================
	// Tags
	// ========================================================

	normalizeTags(value: unknown): string[] {
		if (Array.isArray(value)) {
			return value
				.map(
					(tag) =>
						String(tag)
							.replace(/^#/, "")
							.trim()
				)
				.filter(
					(tag) =>
						tag.length > 0
				);
		}

		if (typeof value === "string") {
			return value
				.split(",")
				.map(
					(tag) =>
						tag
							.replace(/^#/, "")
							.trim()
				)
				.filter(
					(tag) =>
						tag.length > 0
				);
		}

		return [];
	}

	// ========================================================
	// Settings
	// ========================================================

	async loadSettings() {
		const data =
			await this.loadData();

		this.settings =
			Object.assign(
				{},
				DEFAULT_SETTINGS,
				data ?? {}
			);
	}

	async saveSettings() {
		await this.saveData(
			this.settings
		);
	}

	// ========================================================
	// Unload
	// ========================================================

	onunload() {}
}