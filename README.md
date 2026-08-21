# Image Curator

Image Curator is an Obsidian plugin for organizing and classifying images in your vault.

It helps you manage images more efficiently by providing tools for classifying images and assigning tags to them.

## Features

* Classify images in your Obsidian vault.
* Assign existing Obsidian tags to images.
* Manage image classification through a dedicated interface.
* Reuse existing tags from your vault.
* Keep image organization directly inside Obsidian.

## Installation

### Community Plugins

Once Image Curator is available in the Obsidian Community Plugins directory:

1. Open **Settings** in Obsidian.
2. Select **Community plugins**.
3. Click **Browse**.
4. Search for **Image Curator**.
5. Click **Install**.
6. Enable the plugin.

### Manual Installation

You can also install Image Curator manually from the GitHub repository.

Download the latest release and place the following files in:

```text
<Vault>/.obsidian/plugins/image-curator/
```

The directory should contain:

```text
image-curator/
戍式式 main.js
戍式式 manifest.json
戌式式 styles.css
```

Restart Obsidian if necessary, then enable Image Curator from:

**Settings ⊥ Community plugins**

## Usage

After enabling the plugin, use the Image Curator command from the Obsidian command palette.

You can use the plugin to classify images and assign appropriate tags.

The available commands and options may vary depending on the current version of the plugin.

## Requirements

* Obsidian 1.x or later
* A vault containing images to organize

The minimum supported Obsidian version is specified in `manifest.json`.

## Development

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Giacer/ImageCurator.git
cd ImageCurator
npm install
```

Build the plugin:

```bash
npm run build
```

For development with automatic rebuilding:

```bash
npm run dev
```

The generated `main.js` can be installed into an Obsidian vault's plugin directory for testing.

## Support

If you encounter a bug or have a feature request, please open an issue in the GitHub repository:

https://github.com/Giacer/ImageCurator/issues

## License

This project is licensed under the MIT License.
