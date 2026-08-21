import {
	App,
	PluginSettingTab,
	Setting,
} from "obsidian";

import ImageCurator from "./main";


export interface ImageCuratorSettings {
	assetFolder: string;
	noteFolder: string
}


export const DEFAULT_SETTINGS: ImageCuratorSettings = {
	assetFolder: "ImageCurator/Assets",
	noteFolder: "ImageCurator/Notes"
};


export class ImageCuratorSettingTab extends PluginSettingTab {
	plugin: ImageCurator;

	constructor(app: App, plugin: ImageCurator) {
		super(app, plugin);
		this.plugin = plugin;
	}


	display() {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Folder Paths")
			.setHeading();


		// ====================================================
		// Asset Folder
		// ====================================================

		new Setting(containerEl)
			.setName("Asset Folder")
			.setDesc(
				"Folder where classified images will be stored."
			)
			.addText((text) => {
				text
					.setPlaceholder("ImageCurator/Images")
					.setValue(
						this.plugin.settings.assetFolder
					)
					.onChange(async (value) => {
						this.plugin.settings.assetFolder =
							value.trim();

						await this.plugin.saveSettings();
					});
			});
		
		new Setting(containerEl)
			.setName("Note Folder")
			.setDesc("Folder where image asset notes will be stored.")
			.addText((text) => {
				text
					.setPlaceholder("ImageCurator/Notes")
					.setValue(this.plugin.settings.noteFolder)
					.onChange(async (value) => {
						this.plugin.settings.noteFolder = value.trim();
						await this.plugin.saveSettings();
					});
			});
	}

}