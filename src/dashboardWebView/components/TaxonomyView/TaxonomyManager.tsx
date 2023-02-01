import { Messenger } from '@estruyf/vscode/dist/client';
import { ExclamationIcon, PlusSmIcon, TagIcon } from '@heroicons/react/outline';
import * as React from 'react';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { TaxonomyData } from '../../../models';
import { DashboardMessage } from '../../DashboardMessage';
import { Page } from '../../models';
import { SettingsSelector } from '../../state';
import { getTaxonomyField } from '../../../helpers/getTaxonomyField';
import { TaxonomyActions } from './TaxonomyActions';
import { TaxonomyLookup } from './TaxonomyLookup';

export interface ITaxonomyManagerProps {
  data: TaxonomyData | undefined;
  taxonomy: string | null;
  pages: Page[];
}

export const TaxonomyManager: React.FunctionComponent<ITaxonomyManagerProps> = ({ data, taxonomy, pages }: React.PropsWithChildren<ITaxonomyManagerProps>) => {
  const settings = useRecoilValue(SettingsSelector);

  const onCreate = () => {
    Messenger.send(DashboardMessage.createTaxonomy, {
      type: taxonomy
    });
  };
  
  const items = useMemo(() => {
    if (data && taxonomy) {
      let crntItems: string[] = [];

      if (taxonomy === "tags" || taxonomy === "categories") {
        crntItems = data[taxonomy];
      } else {
        crntItems = data.customTaxonomy.find(c => c.id === taxonomy)?.options || [];
      }

      // Alphabetically sort the items
      crntItems = Object.assign([], crntItems).sort((a: string, b: string) => {
        a = a || "";
        b = b || "";

        if (a.toLowerCase() < b.toLowerCase()) {
          return -1;
        }

        if (a.toLowerCase() > b.toLowerCase()) {
          return 1;
        }

        return 0;
      });

      return crntItems;
    }

    return [];
  }, [data, taxonomy]);

  const unmappedItems = useMemo(() => {
    const unmapped: string[] = [];

    if (!pages || !settings?.contentTypes || !taxonomy) {
      return unmapped;
    }

    for (const page of pages) {
      let values: string[] = [];

      if (taxonomy === "tags") {
        values = page.fmTags || [];
      } else if (taxonomy === "categories") {
        values = page.fmCategories || [];
      } else {
        const contentType = settings.contentTypes.find(ct => ct.name === page.fmContentType);

        if (!contentType) {
          return false;
        }
        
        const fieldName = getTaxonomyField(taxonomy, contentType);
        
        if (fieldName && page[fieldName]) {
          values = page[fieldName];
        }
      }

      for (const value of values) {
        if (!items.includes(value)) {
          unmapped.push(value);
        }
      }
    }

    return [...new Set(unmapped)];
  }, [items, taxonomy, pages, settings?.contentTypes]);

  return (
    <div className={`py-6 px-4 flex flex-col h-full overflow-hidden`}>
      <div className={`flex w-full justify-between flex-shrink-0`}>
        <div>
          <h2 className={`text-lg text-gray-500 dark:text-whisper-900 first-letter:uppercase`}>{taxonomy}</h2>
          <p className={`mt-2 text-sm text-gray-500 dark:text-whisper-900 first-letter:uppercase`}>Create, edit, and manage the {taxonomy} of your site</p>
        </div>
        <div>
          <button 
            className={`inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium text-white dark:text-vulcan-500 bg-teal-600 hover:bg-teal-700 focus:outline-none disabled:bg-gray-500`}
            title={`Create a new ${taxonomy} value`}
            onClick={onCreate}>
            <PlusSmIcon className={`mr-2 h-6 w-6`} />
            <span className={`text-sm`}>Create a new {taxonomy} value</span>
          </button>
        </div>
      </div>

      <div className="mt-6 pb-6 -mr-4 pr-4 flex flex-col flex-grow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-vulcan-300">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-whisper-900 uppercase">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-whisper-900 uppercase">Count</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-whisper-900 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-vulcan-300">
            {
              items && items.length > 0 ? 
                items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                      <TagIcon className="inline-block h-4 w-4 mr-2" />
                      <span>{item}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                      <TaxonomyLookup 
                        taxonomy={taxonomy}
                        value={item}
                        pages={pages} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <TaxonomyActions
                        field={taxonomy}
                        value={item} />
                    </td>
                  </tr>
                )) : (
                  !unmappedItems || unmappedItems.length === 0 && (
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200" colSpan={4}>No {taxonomy} found</td>
                    </tr>
                  )
                )
            }
            
            {
              unmappedItems && unmappedItems.length > 0 && 
                unmappedItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200" title='Missing in your settings'>
                      <ExclamationIcon className="inline-block h-4 w-4 mr-2" />
                      <span>{item}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                      <TaxonomyLookup 
                        taxonomy={taxonomy}
                        value={item}
                        pages={pages} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <TaxonomyActions
                        field={taxonomy}
                        value={item}
                        unmapped />
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};