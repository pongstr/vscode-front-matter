import { EditorHelper } from '@estruyf/vscode';
import { window } from 'vscode';
import { Dashboard } from '../../commands/Dashboard';
import { SETTING_CONTENT_SNIPPETS, TelemetryEvent } from '../../constants';
import { DashboardMessage } from '../../dashboardWebView/DashboardMessage';
import { Notifications, Settings, Telemetry } from '../../helpers';
import { Snippets } from '../../models';
import { BaseListener } from './BaseListener';
import { SettingsListener } from './SettingsListener';

export class SnippetListener extends BaseListener {
  public static process(msg: { command: DashboardMessage; data: any }) {
    super.process(msg);

    switch (msg.command) {
      case DashboardMessage.addSnippet:
        this.addSnippet(msg.data);
        break;
      case DashboardMessage.updateSnippet:
        this.updateSnippet(msg.data);
        break;
      case DashboardMessage.insertSnippet:
        Telemetry.send(TelemetryEvent.insertContentSnippet);
        this.insertSnippet(msg.data);
        break;
    }
  }

  private static async addSnippet(data: any) {
    const { title, description, body, fields, isMediaSnippet } = data;

    if (!title || !body) {
      Notifications.warning('Snippet missing title or body');
      return;
    }

    const snippets = Settings.get<any>(SETTING_CONTENT_SNIPPETS);
    if (snippets && snippets[title]) {
      Notifications.warning('Snippet with the same title already exists');
      return;
    }

    const snippetLines = body.split('\n');

    const snippetContent: any = {
      description,
      body: snippetLines.length === 1 ? snippetLines[0] : snippetLines
    };

    if (isMediaSnippet) {
      snippetContent.isMediaSnippet = true;
    } else {
      snippetContent.fields = fields || [];
    }

    snippets[title] = snippetContent;

    await Settings.update(SETTING_CONTENT_SNIPPETS, snippets, true);
    SettingsListener.getSettings(true);
  }

  private static async updateSnippet(data: any) {
    const { snippets } = data;

    if (!snippets) {
      Notifications.warning('No snippets to update');
      return;
    }

    // Filter out external data snippets
    const snippetsToStore = Object.keys(snippets).reduce((acc, key) => {
      if (!snippets[key].sourcePath) {
        acc[key] = snippets[key];
      }
      return acc;
    }, {} as Snippets);

    await Settings.update(SETTING_CONTENT_SNIPPETS, snippetsToStore, true);
    SettingsListener.getSettings(true);
  }

  private static async insertSnippet(data: any) {
    const { file, snippet } = data;

    if (!file || !snippet) {
      return;
    }

    await EditorHelper.showFile(data.file);
    Dashboard.resetViewData();

    const editor = window.activeTextEditor;
    const position = editor?.selection?.active;
    if (!position) {
      return;
    }

    const selection = editor?.selection;
    await editor?.edit((builder) => {
      if (selection !== undefined) {
        builder.replace(selection, snippet);
      } else {
        builder.insert(position, snippet);
      }
    });
  }
}
