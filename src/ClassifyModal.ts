import {
	App,
	Modal,
	Notice,
	Setting,
	TFile,
} from "obsidian";

import {
	ImageProperties,
} from "./types";

import {
	TagManager,
} from "./TagManager";


export class ClassifyModal extends Modal {

	private file: TFile;
	private assetFolder: string;
	private noteFolder: string;

	private tagManager: TagManager;

	private properties: ImageProperties = {
		tags: [],
		description: "",
		date: new Date().toISOString().slice(0, 10),
	};

	private tagInputEl!: HTMLInputElement;
	private tagSuggestionEl!: HTMLDivElement;
	private tagCheckboxEl!: HTMLDivElement;


	constructor(
		app: App,
		file: TFile,
		assetFolder: string,
		noteFolder: string
	) {
		super(app);

		this.file = file;
		this.assetFolder = assetFolder;
		this.noteFolder = noteFolder;

		this.tagManager =
			new TagManager(app);
		console.log("TagManager:", TagManager);
	}


	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.createEl("h2", {
			text: "Create Asset Note",
		});

		this.createDateSetting(contentEl);
		this.createTagSetting(contentEl);
		this.createDescriptionSetting(contentEl);
		this.createButtons(contentEl);
	}


	// ========================================================
	// Date
	// ========================================================

	private createDateSetting(
		containerEl: HTMLElement
	) {
		new Setting(containerEl)
			.setName("Date")
			.setDesc("Date when this image was added")
			.addText((text) => {
				text
					.setValue(this.properties.date)
					.setPlaceholder("YYYY-MM-DD")
					.onChange((value) => {
						this.properties.date = value;
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

		setting.addText((text) => {
			this.tagInputEl =
				text.inputEl;

			text
				.setPlaceholder(
					"mushroom, red, fantasy"
				)
				.onChange((value) => {
					this.updateTagsFromInput(
						value
					);

					this.updateTagSuggestions();

					this.updateTagCheckboxes();
				});

			this.tagInputEl.addEventListener(
				"focus",
				() => {
					this.updateTagSuggestions();
				}
			);

			this.tagInputEl.addEventListener(
				"input",
				() => {
					this.updateTagSuggestions();
				}
			);
		});

		this.tagSuggestionEl =
			containerEl.createDiv(
				"image-curator-tag-suggestions"
			);

		this.tagCheckboxEl =
			containerEl.createDiv(
				"image-curator-tag-checkboxes"
			);

		this.updateTagSuggestions();
		this.updateTagCheckboxes();
	}


	// ========================================================
	// Parse Tags
	// ========================================================

	private updateTagsFromInput(
		value: string
	) {
		this.properties.tags =
			this.tagManager.parseInput(
				value
			);
	}


	// ========================================================
	// Tag Suggestions
	// ========================================================

	private updateTagSuggestions() {
		if (!this.tagInputEl) {
			return;
		}

		const currentTag =
			this.tagManager.getCurrentInputTag(
				this.tagInputEl.value
			);

		this.tagSuggestionEl.empty();

		if (!currentTag) {
			this.hideTagSuggestions();
			return;
		}

		const suggestions =
			this.tagManager.getAutocompleteTags(
				currentTag,
				this.properties.tags,
				10
			);

		if (suggestions.length === 0) {
			this.hideTagSuggestions();
			return;
		}

		this.tagSuggestionEl.removeClass(
			"image-curator-hidden"
		);

		for (const tag of suggestions) {
			const suggestion =
				this.tagSuggestionEl.createDiv(
					"image-curator-tag-suggestion"
				);

			suggestion.setText(tag);

			suggestion.addEventListener(
				"mousedown",
				(event) => {
					event.preventDefault();

					this.selectTagSuggestion(
						tag
					);
				}
			);
		}
	}


	private selectTagSuggestion(
		tag: string
	) {
		if (!this.tagInputEl) {
			return;
		}

		this.tagInputEl.value =
			this.tagManager.replaceCurrentInputTag(
				this.tagInputEl.value,
				tag
			);

		this.updateTagsFromInput(
			this.tagInputEl.value
		);

		this.updateTagCheckboxes();
		this.hideTagSuggestions();

		this.tagInputEl.focus();
	}


	private hideTagSuggestions() {
		if (!this.tagSuggestionEl) {
			return;
		}

		this.tagSuggestionEl.addClass(
			"image-curator-hidden"
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

		for (const tag of existingTags) {
			const row =
				this.tagCheckboxEl.createEl(
					"label",
					{
						cls:
							"image-curator-tag-checkbox",
					}
				);

			const checkbox =
				row.createEl("input");

			checkbox.type =
				"checkbox";

			checkbox.checked =
				this.tagManager.hasExactTag(
					this.properties.tags,
					tag
				);

			const text =
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
					this.properties.tags,
					normalizedTag
				)
			) {
				this.properties.tags.push(
					normalizedTag
				);
			}
		} else {
			this.properties.tags =
				this.properties.tags.filter(
					(value) =>
						!this.tagManager.isExactMatch(
							value,
							normalizedTag
						)
				);
		}

		this.updateTagInput();
	}


	private updateTagInput() {
		if (!this.tagInputEl) {
			return;
		}

		this.tagInputEl.value =
			this.tagManager.toInputValue(
				this.properties.tags
			);

		this.updateTagSuggestions();
	}


	// ========================================================
	// Description
	// ========================================================

	private createDescriptionSetting(
		containerEl: HTMLElement
	) {
		new Setting(containerEl)
			.setName("Description")
			.setDesc("Optional description")
			.addTextArea((text) => {
				text
					.setPlaceholder(
						"Description of this asset"
					)
					.onChange((value) => {
						this.properties.description =
							value;
					});
			});
	}


	// ========================================================
	// Buttons
	// ========================================================

	private createButtons(
		containerEl: HTMLElement
	) {
		new Setting(containerEl)
			.addButton((button) => {
				button
					.setButtonText("Create")
					.setCta()
					.onClick(async () => {
						await this.createNote();
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


	// ========================================================
	// Create Note
	// ========================================================

	private async createNote() {
		const vault =
			this.app.vault;

		const assetFolder =
			this.getFolderPath(
				this.assetFolder,
				"ImageCurator/Assets"
			);

		const noteFolder =
			this.getFolderPath(
				this.noteFolder,
				"ImageCurator/Notes"
			);

		await this.ensureFolder(
			assetFolder
		);

		await this.ensureFolder(
			noteFolder
		);

		const imagePath =
			`${assetFolder}/${this.file.name}`;

		const notePath =
			`${noteFolder}/${this.file.basename}.md`;

		if (
			vault.getAbstractFileByPath(
				imagePath
			)
		) {
			new Notice(
				"An image with the same name already exists."
			);
			return;
		}

		if (
			vault.getAbstractFileByPath(
				notePath
			)
		) {
			new Notice(
				"Asset note already exists."
			);
			return;
		}

		try {
			await vault.rename(
				this.file,
				imagePath
			);

			const tags =
				this.properties.tags
					.map(
						(tag) =>
							`  - ${tag}`
					)
					.join("\n");

			const content =
`---
type: image-asset
date: ${this.properties.date}
tags:
${tags}
description: ${this.properties.description}
---

![[${imagePath}]]
`;

			const note =
				await vault.create(
					notePath,
					content
				);

			new Notice(
				`Created: ${note.name}`
			);

			await this.app.workspace
				.getLeaf(false)
				.openFile(note);

			this.close();

		} catch (error) {
			console.error(
				"[ImageCurator] Failed to create asset note:",
				error
			);

			new Notice(
				"Failed to create asset note."
			);
		}
	}


	// ========================================================
	// Folder
	// ========================================================

	private getFolderPath(
		folder: string,
		defaultFolder: string
	): string {
		return (
			folder?.trim() ||
			defaultFolder
		)
			.replace(/\\/g, "/")
			.replace(
				/^\/+|\/+$/g,
				""
			);
	}


	private async ensureFolder(
		path: string
	) {
		const vault =
			this.app.vault;

		if (!path) {
			return;
		}

		const parts =
			path
				.split("/")
				.filter(
					(part) =>
						part.length > 0
				);

		let currentPath = "";

		for (const part of parts) {
			currentPath =
				currentPath === ""
					? part
					: `${currentPath}/${part}`;

			const existing =
				vault.getAbstractFileByPath(
					currentPath
				);

			if (!existing) {
				await vault.createFolder(
					currentPath
				);
			}
		}
	}


	onClose() {
		this.contentEl.empty();
	}
}