import { DataFileHelper } from './../../helpers/DataFileHelper';
import { BlockFieldData } from './../../models/BlockFieldData';
import { ImageHelper } from './../../helpers/ImageHelper';
import { Folders } from '../../commands/Folders';
import { Command } from '../../panelWebView/Command';
import { CommandToCode } from '../../panelWebView/CommandToCode';
import { BaseListener } from './BaseListener';
import { commands, ThemeIcon, window } from 'vscode';
import { ArticleHelper, Logger, Settings } from '../../helpers';
import {
  COMMAND_NAME,
  DefaultFields,
  SETTING_COMMA_SEPARATED_FIELDS,
  SETTING_DATE_FORMAT,
  SETTING_TAXONOMY_CONTENT_TYPES
} from '../../constants';
import { Article } from '../../commands';
import { ParsedFrontMatter } from '../../parsers';
import { processKnownPlaceholders } from '../../helpers/PlaceholderHelper';

const FILE_LIMIT = 10;

export class DataListener extends BaseListener {
  private static lastMetadataUpdate: any = {};
  private static readonly terminalName: string = 'Local server';

  /**
   * Process the messages for the dashboard views
   * @param msg
   */
  public static process(msg: { command: CommandToCode; data: any }) {
    super.process(msg);

    switch (msg.command) {
      case CommandToCode.getData:
        this.getFoldersAndFiles();
        this.getFileData();
        break;
      case CommandToCode.createContent:
        commands.executeCommand(COMMAND_NAME.createContent);
        break;
      case CommandToCode.createTemplate:
        commands.executeCommand(COMMAND_NAME.createTemplate);
        break;
      case CommandToCode.updateMetadata:
        this.updateMetadata(msg.data);
        break;
      case CommandToCode.frameworkCommand:
        this.openTerminalWithCommand(msg.data.command);
        break;
      case CommandToCode.stopServer:
        this.stopServer();
        break;
      case CommandToCode.updatePlaceholder:
        this.updatePlaceholder(msg?.data?.field, msg?.data?.value, msg?.data?.title);
        break;
      case CommandToCode.generateContentType:
        commands.executeCommand(COMMAND_NAME.generateContentType);
        break;
      case CommandToCode.addMissingFields:
        commands.executeCommand(COMMAND_NAME.addMissingFields);
        break;
      case CommandToCode.setContentType:
        commands.executeCommand(COMMAND_NAME.setContentType);
        break;
      case CommandToCode.getDataEntries:
        this.getDataFileEntries(msg.data);
        break;
    }
  }

  /**
   * Retrieve the information about the registered folders and its files
   */
  public static async getFoldersAndFiles() {
    const folders = (await Folders.getInfo(FILE_LIMIT)) || null;

    this.sendMsg(Command.folderInfo, folders);
  }

  /**
   * Triggers a metadata change in the panel
   * @param metadata
   */
  public static pushMetadata(metadata: any) {
    const wsFolder = Folders.getWorkspaceFolder();
    const filePath = window.activeTextEditor?.document.uri.fsPath;
    const commaSeparated = Settings.get<string[]>(SETTING_COMMA_SEPARATED_FIELDS);
    const contentTypes = Settings.get<string>(SETTING_TAXONOMY_CONTENT_TYPES);

    let articleDetails = null;

    try {
      articleDetails = ArticleHelper.getDetails();
    } catch (e) {
      Logger.error(`DataListener::pushMetadata: ${(e as Error).message}`);
    }

    if (articleDetails) {
      metadata.articleDetails = articleDetails;
    }

    let updatedMetadata = Object.assign({}, metadata);
    if (commaSeparated) {
      for (const key of commaSeparated) {
        if (updatedMetadata[key] && typeof updatedMetadata[key] === 'string') {
          updatedMetadata[key] = updatedMetadata[key].split(',').map((s: string) => s.trim());
        }
      }
    }

    const keys = Object.keys(updatedMetadata);
    if (keys.length > 0) {
      updatedMetadata.filePath = filePath;
    }

    if (keys.length > 0 && contentTypes && wsFolder) {
      // Get the current content type
      const contentType = ArticleHelper.getContentType(updatedMetadata);
      let slugField;
      if (contentType) {
        ImageHelper.processImageFields(updatedMetadata, contentType.fields);

        slugField = contentType.fields.find((f) => f.type === 'slug');
      }

      // Check slug
      if (!slugField && !updatedMetadata[DefaultFields.Slug]) {
        const slug = Article.getSlug();

        if (slug) {
          updatedMetadata[DefaultFields.Slug] = slug;
        }
      }
    }

    // if (JSON.stringify(DataListener.lastMetadataUpdate) !== JSON.stringify(updatedMetadata)) {
    this.sendMsg(Command.metadata, updatedMetadata);
    // }

    DataListener.lastMetadataUpdate = updatedMetadata;
  }

  /**
   * Update the metadata of the article
   */
  public static async updateMetadata({
    field,
    parents,
    value,
    blockData
  }: {
    field: string;
    value: any;
    parents?: string[];
    blockData?: BlockFieldData;
    fieldData?: { multiple: boolean; value: string[] };
  }) {
    if (!field) {
      return;
    }

    const editor = window.activeTextEditor;
    if (!editor) {
      return;
    }

    const article = ArticleHelper.getFrontMatter(editor);
    if (!article) {
      return;
    }

    const contentType = ArticleHelper.getContentType(article.data);
    const dateFields = contentType.fields.filter((f) => f.type === 'datetime');
    const imageFields = contentType.fields.filter((f) => f.type === 'image' && f.multiple);
    const fileFields = contentType.fields.filter((f) => f.type === 'file' && f.multiple);

    // Support multi-level fields
    const parentObj = DataListener.getParentObject(article.data, article, parents, blockData);

    const isDateField = dateFields.some((f) => f.name === field);
    const isMultiImageField = imageFields.some((f) => f.name === field);
    const isMultiFileField = fileFields.some((f) => f.name === field);

    if (isDateField) {
      for (const dateField of dateFields) {
        if (field === dateField.name && value) {
          parentObj[field] = Article.formatDate(new Date(value));
        }
      }
    } else if (isMultiImageField || isMultiFileField) {
      const fields = isMultiImageField ? imageFields : fileFields;

      for (const crntField of fields) {
        if (field === crntField.name) {
          // If value is an array, it means it comes from the explorer view itself (deletion)
          if (Array.isArray(value)) {
            parentObj[field] = value || [];
          } else {
            // Otherwise it is coming from the media dashboard (addition)
            let fieldValue = parentObj[field];
            if (fieldValue && !Array.isArray(fieldValue)) {
              fieldValue = [fieldValue];
            }
            const crntData = Object.assign([], fieldValue);
            const allRelPaths = [...(crntData || []), value];
            parentObj[field] = [...new Set(allRelPaths)].filter((f) => f);
          }
        }
      }
    } else {
      parentObj[field] = value;
    }

    ArticleHelper.update(editor, article);
    this.pushMetadata(article.data);
  }

  /**
   * Retrieve the parent object to update
   * @param data
   * @param article
   * @param parents
   * @param blockData
   * @returns
   */
  public static getParentObject(
    data: any,
    article: ParsedFrontMatter,
    parents: string[] | undefined,
    blockData?: BlockFieldData
  ) {
    let parentObj = data;
    let allParents = Object.assign([], parents);
    const contentType = ArticleHelper.getContentType(article.data);

    // Add support for block fields
    if (blockData?.parentFields) {
      let crntField = null;
      parentObj = article.data;

      // Loop through the parents of the block field
      for (const parent of blockData?.parentFields) {
        if (!parentObj[parent]) {
          parentObj[parent] = {};
        }

        if (allParents[0] && allParents[0] === parent) {
          allParents.shift();
        }

        parentObj = parentObj[parent];
        crntField = contentType.fields.find((f) => f.name === parent);
      }

      // Fetches the current block
      if (blockData && crntField && crntField.type === 'block') {
        if (typeof blockData.selectedIndex !== 'undefined') {
          parentObj = parentObj[blockData.selectedIndex];
        } else {
          parentObj.push({
            fieldGroup: blockData.blockType
          });
          parentObj = parentObj[parentObj.length - 1];
        }
      }

      // Check if there are parents left
      if (allParents.length > 0) {
        for (const parent of allParents) {
          if (!parentObj[parent]) {
            parentObj[parent] = {};
          }

          parentObj = parentObj[parent];
        }
      }
    } else {
      for (const parent of parents || []) {
        // If parent doesn't yet exists, it needs to be created
        if (!parentObj[parent]) {
          parentObj[parent] = {};
        }

        parentObj = parentObj[parent];
      }
    }

    return parentObj;
  }

  /**
   * Retrieve the file its front matter
   */
  public static async getFileData() {
    const editor = window.activeTextEditor;
    if (!editor) {
      return '';
    }

    const article = ArticleHelper.getFrontMatter(editor);
    if (article?.data) {
      this.pushMetadata(article!.data);
    }
  }

  /**
   * Retrieve the data entries from local data files
   * @param data
   */
  private static async getDataFileEntries(data: any) {
    const entries = await DataFileHelper.getById(data);
    if (entries) {
      this.sendMsg(Command.dataFileEntries, entries);
    }
  }

  /**
   * Open a terminal and run the passed command
   * @param command
   */
  private static openTerminalWithCommand(command: string) {
    if (command) {
      let localServerTerminal = DataListener.findServerTerminal();
      if (localServerTerminal) {
        localServerTerminal.dispose();
      }

      if (
        !localServerTerminal ||
        (localServerTerminal && localServerTerminal.state.isInteractedWith === true)
      ) {
        localServerTerminal = window.createTerminal({
          name: this.terminalName,
          iconPath: new ThemeIcon('server-environment'),
          message: `Starting local server`
        });
      }

      if (localServerTerminal) {
        localServerTerminal.sendText(command);
        localServerTerminal.show(false);
      }
    }
  }

  /**
   * Stop the local server
   */
  private static stopServer() {
    const localServerTerminal = DataListener.findServerTerminal();
    if (localServerTerminal) {
      localServerTerminal.dispose();
    }
  }

  /**
   * Find the server terminal
   * @returns
   */
  private static findServerTerminal() {
    let terminals = window.terminals;
    if (terminals) {
      const localServerTerminal = terminals.find((t) => t.name === DataListener.terminalName);
      return localServerTerminal;
    }
  }

  /**
   * Update the placeholder
   * @param field
   * @param value
   * @param title
   */
  private static async updatePlaceholder(field: string, value: string, title: string) {
    if (field && value) {
      const crntFile = window.activeTextEditor?.document;
      const dateFormat = Settings.get(SETTING_DATE_FORMAT) as string;
      value = processKnownPlaceholders(value, title || '', dateFormat);
      value = await ArticleHelper.processCustomPlaceholders(
        value,
        title || '',
        crntFile?.uri.fsPath || ''
      );
    }

    this.sendMsg(Command.updatePlaceholder, { field, value });
  }
}
