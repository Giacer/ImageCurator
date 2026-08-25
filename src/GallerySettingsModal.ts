import {
	App,
	Modal,
	Notice,
	Setting,
} from "obsidian";

import {
	GallerySettings,
} from "./types";

import ImageCurator from "./main";

import {
	TagManager,
} from "./TagManager";


export class GallerySettingsModal extends Modal {

	private plugin: ImageCurator;

	private tagManager: TagManager;

	private tagInputEl!: HTMLInputElement;

	private tagCheckboxEl!: HTMLDivElement;


	private settings: GallerySettings = {
		tags: [],
		sort: "newest",
		count: 100,
		columns: 4,
	};


	constructor(
		app: App,
		plugin: ImageCurator
	) {
		super(app);

		this.plugin = plugin;

		this.tagManager =
			new TagManager(app);
	}


	onOpen() {

		const { contentEl } =
			this;

		contentEl.empty();


		contentEl.createEl("h2", {
			text: "Open Image Gallery",
		});


		// ====================================================
		// Tags
		// ====================================================

		this.createTagSetting(
			contentEl
		);


		// ====================================================
		// Sort
		// ====================================================

		new Setting(contentEl)
			.setName("Sort")
			.setDesc("Image sorting method")
			.addDropdown((dropdown) => {

				dropdown
					.addOption(
						"newest",
						"Newest"
					)
					.addOption(
						"oldest",
						"Oldest"
					)
					.addOption(
						"random",
						"Random"
					)
					.setValue(
						this.settings.sort
					)
					.onChange((value) => {

						this.settings.sort =
							value as
								"newest" |
								"oldest" |
								"random";
					});
			});


		// ====================================================
		// Count
		// ====================================================

		new Setting(contentEl)
			.setName("Image Count")
			.addSlider((slider) => {

				slider
					.setLimits(
						10,
						1000,
						5
					)
					.setValue(
						this.settings.count
					)
					.setDynamicTooltip()
					.onChange((value) => {

						this.settings.count =
							value;
					});
			});


		// ====================================================
		// Columns
		// ====================================================

		new Setting(contentEl)
			.setName("Images per Row")
			.setDesc("Number of columns")
			.addSlider((slider) => {

				slider
					.setLimits(
						1,
						8,
						1
					)
					.setValue(
						this.settings.columns
					)
					.setDynamicTooltip()
					.onChange((value) => {

						this.settings.columns =
							value;
					});
			});


		// ====================================================
		// Buttons
		// ====================================================

		new Setting(contentEl)
			.addButton((button) => {

				button
					.setButtonText(
						"Open Gallery"
					)
					.setCta()
					.onClick(async () => {

						const assets =
							this.plugin.getAssets();

						const filtered =
							this.plugin.filterAssets(
								assets,
								this.settings
							);

						if (
							filtered.length === 0
						) {

							new Notice(
								"No matching images found."
							);

							return;
						}


						await this.plugin.openGallery(
							this.settings
						);

						this.close();
					});
			})
			.addButton((button) => {

				button
					.setButtonText(
						"Cancel"
					)
					.onClick(() => {

						this.close();
					});
			});
	}


	// ========================================================
	// Tags
	// ========================================================

	private createTagSetting(
		containerEl: HTMLElement
	) {

		const setting =
			new Setting(containerEl)
				.setName("Tags")
				.setDesc(
					"Enter tags separated by commas or select existing tags."
				);


		// ----------------------------------------------------
		// Text Input
		// ----------------------------------------------------

		setting.addText((text) => {

			this.tagInputEl =
				text.inputEl;

			text
				.setPlaceholder(
					"mushroom, red"
				)
				.onChange((value) => {

					this.updateTagsFromInput(
						value
					);

					this.updateTagCheckboxes();
				});
		});


		// ----------------------------------------------------
		// Existing Tags
		// ----------------------------------------------------

		this.tagCheckboxEl =
			containerEl.createDiv(
				"image-curator-tag-checkboxes"
			);


		this.updateTagCheckboxes();
	}


	// ========================================================
	// Parse Tags
	// ========================================================

	private updateTagsFromInput(
		value: string
	) {

		this.settings.tags =
			this.tagManager.parseInput(
				value
			);
	}


	// ========================================================
	// Tag Checkboxes
	// ========================================================

	private updateTagCheckboxes() {

		if (!this.tagCheckboxEl) {
			return;
		}


		this.tagCheckboxEl.empty();


		const existingTags =
			this.tagManager.getVisibleTags();


		if (existingTags.length === 0) {
			return;
		}


		// ----------------------------------------------------
		// Title
		// ----------------------------------------------------

		const title =
			this.tagCheckboxEl.createEl(
				"div",
				{
					text: "Existing Tags",
				}
			);

		title.addClass(
			"image-curator-tag-title"
		);


		// ----------------------------------------------------
		// Checkboxes
		// ----------------------------------------------------

		for (
			const tag of existingTags
		) {

			const row =
				this.tagCheckboxEl.createEl(
					"label",
					{
						cls:
							"image-curator-tag-checkbox",
					}
				);


			const checkbox =
				row.createEl(
					"input"
				);

			checkbox.type =
				"checkbox";


			checkbox.checked =
				this.tagManager.hasExactTag(
					this.settings.tags,
					tag
				);


			row.createEl(
				"span",
				{
					text: tag,
				}
			);


			checkbox.addEventListener(
				"change",
				() => {

					this.toggleTag(
						tag,
						checkbox.checked
					);
				}
			);
		}
	}


	// ========================================================
	// Toggle Tag
	// ========================================================

	private toggleTag(
		tag: string,
		checked: boolean
	) {

		const normalizedTag =
			this.tagManager.normalize(
				tag
			);


		if (checked) {

			if (
				!this.tagManager.hasExactTag(
					this.settings.tags,
					normalizedTag
				)
			) {

				this.settings.tags.push(
					normalizedTag
				);
			}

		}
		else {

			this.settings.tags =
				this.settings.tags.filter(
					(value) =>
						!this.tagManager.isExactMatch(
							value,
							normalizedTag
						)
				);
		}


		this.updateTagInput();
	}


	// ========================================================
	// Update Input
	// ========================================================

	private updateTagInput() {

		if (!this.tagInputEl) {
			return;
		}


		this.tagInputEl.value =
			this.tagManager.toInputValue(
				this.settings.tags
			);
	}


	onClose() {

		this.contentEl.empty();
	}
}