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


export class ClassifyModal extends Modal {

	private file: TFile;
	private assetFolder: string;
	private noteFolder: string;

	private properties: ImageProperties = {
		tags: [],
		description: "",
		date: new Date().toISOString().slice(0, 10),
	};

	private tagInputEl!: HTMLInputElement;
	private tagSuggestionEl!: HTMLDivElement;
	private tagCheckboxEl!: HTMLDivElement;

	private existingTags: string[] = [];


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
	}


	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		contentEl.createEl("h2", {
			text: "Create Asset Note",
		});

		this.existingTags = this.getExistingTags();

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

    private createTagSetting(containerEl: HTMLElement) {
        const setting = new Setting(containerEl)
            .setName("Tags")
            .setDesc("Enter tags separated by commas or select existing tags.");

        setting.addText((text) => {
            this.tagInputEl = text.inputEl;

            text
                .setPlaceholder("mushroom, red, fantasy")
                .onChange((value) => {
                    this.updateTagsFromInput(value);
                    this.updateTagSuggestions();
                    this.updateTagCheckboxes();
                });

            this.tagInputEl.addEventListener("focus", () => {
                this.updateTagSuggestions();
            });

            this.tagInputEl.addEventListener("input", () => {
                this.updateTagSuggestions();
            });
        });

        this.tagSuggestionEl = containerEl.createDiv(
            "image-curator-tag-suggestions"
        );

        this.tagCheckboxEl = containerEl.createDiv(
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
		this.properties.tags = value
			.split(",")
			.map((tag) =>
				tag
					.trim()
					.replace(/^#/, "")
			)
			.filter(
				(tag) =>
					tag.length > 0
			);
	}


	// ========================================================
	// Tag Suggestions
	// ========================================================

	private updateTagSuggestions() {
		if (!this.tagInputEl) {
			return;
		}

		const value =
			this.tagInputEl.value;

		const parts =
			value.split(",");

		const currentPart =
			parts[parts.length - 1] ?? "";

		const currentTag =
			currentPart
				.trim()
				.replace(/^#/, "")
				.toLowerCase();

		this.tagSuggestionEl.empty();

		if (!currentTag) {
			this.hideTagSuggestions();
			return;
		}

		const suggestions =
			this.existingTags
				.filter((tag) =>
					tag
						.toLowerCase()
						.includes(currentTag)
				)
				.filter((tag) =>
					!this.properties.tags.includes(tag)
				)
				.slice(0, 10);

		if (suggestions.length === 0) {
			this.hideTagSuggestions();
			return;
		}

		this.tagSuggestionEl.style.display =
			"block";

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
					this.selectTagSuggestion(tag);
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

		const parts =
			this.tagInputEl.value.split(",");

		parts[parts.length - 1] =
			` ${tag}`;

		this.tagInputEl.value =
			parts.join(",").replace(
				/^ /,
				""
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

		this.tagSuggestionEl.style.display =
			"none";
	}


	// ========================================================
	// Tag Checkboxes
	// ========================================================

    private updateTagCheckboxes() {
        if (!this.tagCheckboxEl) {
            return;
        }

        this.tagCheckboxEl.empty();

        if (this.existingTags.length === 0) {
            return;
        }

        const title = this.tagCheckboxEl.createEl("div", {
            text: "Existing Tags",
        });

        title.addClass(
            "image-curator-tag-title"
        );

        for (const tag of this.existingTags) {
            const row = this.tagCheckboxEl.createEl(
                "label",
                {
                    cls: "image-curator-tag-checkbox",
                }
            );

            const checkbox = row.createEl(
                "input"
            );

            checkbox.type = "checkbox";
            checkbox.checked =
                this.properties.tags.includes(tag);

            const text = row.createEl("span", {
                text: tag,
            });

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
		if (checked) {
			if (
				!this.properties.tags.includes(
					tag
				)
			) {
				this.properties.tags.push(tag);
			}
		} else {
			this.properties.tags =
				this.properties.tags.filter(
					(value) =>
						value !== tag
				);
		}

		this.updateTagInput();
	}


	private updateTagInput() {
		if (!this.tagInputEl) {
			return;
		}

		this.tagInputEl.value =
			this.properties.tags.join(", ");

		this.updateTagSuggestions();
	}


	// ========================================================
	// Existing Tags
	// ========================================================

	private getExistingTags(): string[] {
		const tags = new Set<string>();

		const files =
			this.app.vault.getMarkdownFiles();

		for (const file of files) {
			const cache =
				this.app.metadataCache
					.getFileCache(file);

			const frontmatter =
				cache?.frontmatter;

			if (!frontmatter) {
				continue;
			}

			const value =
				frontmatter.tags;

			if (Array.isArray(value)) {
				for (const tag of value) {
					this.addTag(tags, tag);
				}
			} else if (
				typeof value === "string"
			) {
				for (
					const tag
					of value.split(",")
				) {
					this.addTag(tags, tag);
				}
			}
		}

		return Array.from(tags).sort(
			(a, b) =>
				a.localeCompare(b)
		);
	}


	private addTag(
		tags: Set<string>,
		value: unknown
	) {
		if (
			typeof value !== "string"
		) {
			return;
		}

		const tag =
			value
				.replace(/^#/, "")
				.trim();

		if (tag.length > 0) {
			tags.add(tag);
		}
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