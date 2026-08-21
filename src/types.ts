import { TFile } from "obsidian";


export interface ImageProperties {
	tags: string[];
	description: string;
	date: string;
}


export interface GallerySettings {
	tags: string[];
	sort:
		| "newest"
		| "oldest"
		| "random";
	count: number;
	columns: number;
}


export interface ImageAsset {
	note: TFile;
	image: TFile;
	date: string;
	description: string;
	tags: string[];
}