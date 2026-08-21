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


export class GallerySettingsModal extends Modal {

	private plugin: ImageCurator;

	private settings: GallerySettings = {
		tags: [],
		sort: "newest",
		count: 100,
		columns: 4,
	};


	constructor(app: App, plugin: ImageCurator) {
		super(app);
		this.plugin = plugin;
	}


	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.createEl("h2", {
			text: "Open Image Gallery",
		});


		// ====================================================
		// Tags
		// ====================================================

		new Setting(contentEl)
			.setName("Tags")
			.setDesc("Separate multiple tags with commas")
			.addText((text) => {
				text
					.setPlaceholder("mushroom, red")
					.onChange((value) => {
						this.settings.tags = value
							.split(",")
							.map((tag) =>
								tag
									.trim()
									.replace(/^#/, "")
							)
							.filter((tag) => tag.length > 0);
					});
			});


		// ====================================================
		// Sort
		// ====================================================

		new Setting(contentEl)
			.setName("Sort")
			.setDesc("Image sorting method")
			.addDropdown((dropdown) => {
				dropdown
					.addOption("newest", "Newest")
					.addOption("oldest", "Oldest")
					.addOption("random", "Random")
					.setValue(this.settings.sort)
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
					.setLimits(10, 1000, 5)
					.setValue(this.settings.count)
					.setDynamicTooltip()
					.onChange((value) => {
						this.settings.count = value;
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
					.setLimits(1, 8, 1)
					.setValue(this.settings.columns)
					.setDynamicTooltip()
					.onChange((value) => {
						this.settings.columns = value;
					});
			});


		// ====================================================
		// Buttons
		// ====================================================

		new Setting(contentEl)
			.addButton((button) => {
				button
					.setButtonText("Open Gallery")
					.setCta()
					.onClick(async () => {
						const assets =
							this.plugin.getAssets();

						const filtered =
							this.plugin.filterAssets(
								assets,
								this.settings
							);

						if (filtered.length === 0) {
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
					.setButtonText("Cancel")
					.onClick(() => {
						this.close();
					});
			});
	}


	onClose() {
		this.contentEl.empty();
	}

}