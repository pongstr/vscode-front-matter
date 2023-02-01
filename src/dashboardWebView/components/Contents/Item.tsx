import * as React from 'react';
import { useRecoilValue } from 'recoil';
import { MarkdownIcon } from '../../../panelWebView/components/Icons/MarkdownIcon';
import { DashboardMessage } from '../../DashboardMessage';
import { Page } from '../../models/Page';
import { SettingsSelector, ViewSelector } from '../../state';
import { DateField } from '../DateField';
import { Status } from '../Status';
import { Messenger } from '@estruyf/vscode/dist/client';
import { DashboardViewType } from '../../models';
import { ContentActions } from './ContentActions';
import { useMemo } from 'react';

export type IItemProps = Page

const PREVIEW_IMAGE_FIELD = 'fmPreviewImage';

export const Item: React.FunctionComponent<IItemProps> = ({ fmFilePath, date, title, description, ...pageData }: React.PropsWithChildren<IItemProps>) => {
  const view = useRecoilValue(ViewSelector);
  const settings = useRecoilValue(SettingsSelector);
  const draftField = useMemo(() => settings?.draftField, [settings]);

  const escapedTitle = useMemo(() => {
    if (title && typeof title !== 'string') {
      return '<invalid title>';
    }

    return title;
  }, [title]);

  const escapedDescription = useMemo(() => {
    if (description && typeof description !== 'string') {
      return '<invalid description>';
    }

    return description;
  }, [description]);

  const openFile = () => {
    Messenger.send(DashboardMessage.openFile, fmFilePath);
  };

  const tags: string[] | undefined = React.useMemo(() => {
    if (!settings?.dashboardState?.contents?.tags) {
      return undefined;
    }

    const tagField = settings.dashboardState.contents.tags;
    let tagsValue = [];

    if (tagField === "tags") {
      tagsValue = pageData.fmTags;
    } else if (tagField === "categories") {
      tagsValue = pageData.fmCategories;
    } else {
      tagsValue = pageData[tagField] || [];
    }

    if (typeof tagsValue === "string") {
      return [tagsValue];
    } else if (Array.isArray(tagsValue)) {
      return tagsValue;
    }

    return [];
  }, [settings, pageData]);

  if (view === DashboardViewType.Grid) {
    return (
      <li className="relative">
        <div className={`group flex flex-wrap items-start content-start h-full w-full bg-gray-50 dark:bg-vulcan-200 text-vulcan-500 dark:text-whisper-500 text-left shadow-md dark:shadow-none hover:shadow-xl dark:hover:bg-vulcan-100 border border-gray-200 dark:border-vulcan-50`}>

          <button onClick={openFile} className="relative h-36 w-full overflow-hidden border-b border-gray-100 dark:border-vulcan-100 dark:group-hover:border-vulcan-200 cursor-pointer">
            {
              pageData[PREVIEW_IMAGE_FIELD] ? (
                <img src={`${pageData[PREVIEW_IMAGE_FIELD]}`} alt={escapedTitle} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className={`flex items-center justify-center bg-whisper-500 dark:bg-vulcan-200 dark:group-hover:bg-vulcan-100`}>
                  <MarkdownIcon className={`h-32 text-vulcan-100 dark:text-whisper-100`} />
                </div>
              )
            }
          </button>

          <div className="relative p-4 w-full">
            <div className={`flex justify-between items-center`}>
              {  draftField && draftField.name && <Status draft={pageData[draftField.name]} /> }

              <DateField className={`mr-4`} value={date} />

              <ContentActions
                title={title}
                path={fmFilePath}
                scripts={settings?.scripts}
                onOpen={openFile} />
            </div>

            <button onClick={openFile} className={`text-left block`}><h2 className="mt-2 mb-2 font-bold">{escapedTitle}</h2></button>

            <button onClick={openFile} className={`text-left block`}><p className="text-xs text-vulcan-200 dark:text-whisper-800">{escapedDescription}</p></button>

            {
              tags && tags.length > 0 && (
                <div className="mt-2">
                  {
                    tags.map((tag, index) => (
                      tag && (
                        <span
                          key={index}
                          className="inline-block mr-1 mt-1 text-[#5D561D] dark:text-[#F0ECD0] text-xs">
                          #{tag}
                        </span>
                      )
                    ))
                  }
                </div>
              )
            }
          </div>
        </div>
      </li>
    );
  } else if (view === DashboardViewType.List) {
    return (
      <li className="relative">
        <div className={`px-5 cursor-pointer w-full text-left grid grid-cols-12 gap-x-4 sm:gap-x-6 xl:gap-x-8 py-2 border-b border-gray-300 hover:bg-gray-200 dark:border-vulcan-50 dark:hover:bg-vulcan-50 hover:bg-opacity-70`}>
          <div className="col-span-8 font-bold truncate flex items-center space-x-4">
            <button
              title={`Open: ${escapedTitle}`}
              onClick={openFile}>
              {escapedTitle}
            </button>

            <ContentActions
              title={escapedTitle}
              path={fmFilePath}
              scripts={settings?.scripts}
              onOpen={openFile}
              listView />
          </div>
          <div className="col-span-2">
            <DateField value={date} />
          </div>
          <div className="col-span-2">
            { draftField && draftField.name && <Status draft={pageData[draftField.name]} /> }
          </div>
        </div>
      </li>
    );
  }

  return null;
};
