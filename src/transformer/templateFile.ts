/* eslint-disable @typescript-eslint/no-explicit-any */
import { mkdirSync, readFileSync } from "fs";
import { writeFile } from "fs/promises";
import { dirname, join } from "path";
import { capitalizeFirstLetter } from "../helpers/capitalizeFirstLetter";

const camelCaseReplacer = /__component__/g;
const pascalCaseReplacer = /__Component__/g;

const getSlug = (text: string): string =>
  text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-") // whitespaces --> dash
    .replace(/[^0-9a-z-]/g, "") // remove all non simple characters
    .replace(/-+/g, "-") // consecutive dashes with one dash
    .replace(/^-|-$/g, ""); // remove leading and trailing dashes

export default class TemplateFile {
  private type: "text" | "json" = "text";
  private content: any = null;
  private camelCaseName: string;
  private pascalCaseName: string;
  private destinationPath: string;

  constructor(
    private componentName: string,
    private sourcePath: string,
    private sourceDir: string,
    private destinationDir: string,
    private renameComponent: boolean
  ) {
    if (sourcePath.endsWith(".json")) {
      this.type = "json";
    }
    this.destinationPath = sourcePath.endsWith(".mdx")
      ? join(dirname(this.sourcePath), `${getSlug(componentName)}.mdx`)
      : this.sourcePath;
    this.camelCaseName = "";
    this.pascalCaseName = "";

    this.content = readFileSync(join(this.sourceDir, this.sourcePath), "utf-8");

    this.camelCaseName = this.componentName
      .split("-")
      .map((part, index) => (index > 0 ? capitalizeFirstLetter(part) : part))
      .join("");
    this.pascalCaseName = this.componentName
      .split("-")
      .map(capitalizeFirstLetter)
      .join("");

    // replace component name
    this.destinationPath = this.replaceName(this.destinationPath).replace(
      /__$/,
      ""
    ); // some files need a fake ending (like design system mdx) so we remove it here

    // replace content
    this.content = this.replaceName(this.content);

    // parse json if desired
    if (this.type === "json") {
      this.content = JSON.parse(this.content);
    }
  }

  private replaceName(input: string): string {
    if (this.renameComponent) {
      return input
        .replace(camelCaseReplacer, this.camelCaseName)
        .replace(pascalCaseReplacer, this.pascalCaseName);
    }
    return input
      .replace(camelCaseReplacer, this.componentName)
      .replace(pascalCaseReplacer, this.componentName);
  }

  public getFilename(): string {
    return this.destinationPath;
  }

  public getContent(): any {
    return this.content;
  }

  public getCamelCaseName(): string {
    return this.camelCaseName;
  }

  public getPascalCaseName(): string {
    return this.pascalCaseName;
  }

  public updateContent(modify: (content: any) => any): void {
    this.content = modify(this.content);
  }

  // write file to disk
  public write(): Promise<void> {
    const filename = join(this.destinationDir, this.destinationPath);

    // ensure directory exists
    mkdirSync(dirname(filename), { recursive: true });

    let data = this.content;
    if (this.type === "json") {
      data = JSON.stringify(this.content, null, 2);
    }
    return writeFile(filename, data);
  }
}
