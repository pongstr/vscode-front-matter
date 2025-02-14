import { commands } from 'vscode';
import {
  COMMAND_NAME,
  SETTING_TAXONOMY_CATEGORIES,
  SETTING_TAXONOMY_CUSTOM,
  SETTING_TAXONOMY_TAGS
} from '../../constants';
import { DashboardCommand } from '../../dashboardWebView/DashboardCommand';
import { DashboardMessage } from '../../dashboardWebView/DashboardMessage';
import { Settings, TaxonomyHelper } from '../../helpers';
import { CustomTaxonomy } from '../../models';
import { BaseListener } from './BaseListener';

export class TaxonomyListener extends BaseListener {
  /**
   * Process the messages for the dashboard views
   * @param msg
   */
  public static process(msg: { command: DashboardMessage; data: any }) {
    super.process(msg);

    switch (msg.command) {
      case DashboardMessage.getTaxonomyData:
        this.getData();
        break;
      case DashboardMessage.editTaxonomy:
        TaxonomyHelper.rename(msg.data);
        break;
      case DashboardMessage.mergeTaxonomy:
        TaxonomyHelper.merge(msg.data);
        break;
      case DashboardMessage.deleteTaxonomy:
        TaxonomyHelper.delete(msg.data);
        break;
      case DashboardMessage.moveTaxonomy:
        TaxonomyHelper.move(msg.data);
        break;
      case DashboardMessage.addToTaxonomy:
        TaxonomyHelper.addTaxonomy(msg.data);
        break;
      case DashboardMessage.createTaxonomy:
        TaxonomyHelper.createNew(msg.data);
        break;
      case DashboardMessage.importTaxonomy:
        commands.executeCommand(COMMAND_NAME.exportTaxonomy);
        break;
    }
  }

  private static async getData() {
    // Retrieve the tags, categories and custom taxonomy
    const taxonomyData = {
      tags: Settings.get<string[]>(SETTING_TAXONOMY_TAGS) || [],
      categories: Settings.get<string[]>(SETTING_TAXONOMY_CATEGORIES) || [],
      customTaxonomy: Settings.get<CustomTaxonomy[]>(SETTING_TAXONOMY_CUSTOM) || []
    };

    this.sendMsg(DashboardCommand.setTaxonomyData, taxonomyData);
  }
}
