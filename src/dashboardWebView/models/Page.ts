export interface Page {
  // Properties for caching
  fmCachePath: string;
  fmCacheModifiedTime: number;

  // Front matter fields
  fmFolder: string;
  fmFilePath: string;
  fmFileName: string;
  fmModified: number;
  fmPublished: number | null | undefined;
  fmDraft: 'Draft' | 'Published';
  fmYear: number | null | undefined;
  fmPreviewImage: string;
  fmTags: string[];
  fmCategories: string[];
  fmContentType: string;

  title: string;
  slug: string;
  date: string | Date;
  draft: boolean | string;
  description: string;

  preview?: string;
  [prop: string]: any;
}
