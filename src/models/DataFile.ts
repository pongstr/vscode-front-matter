export interface DataFile {
  id: string;
  title: string;
  file: string;
  fileType: "json" | "yaml";
  labelField: string;
  schema?: unknown;
  type?: string;
  singleEntry?: boolean;
}
