import { Messenger } from '@estruyf/vscode/dist/client';
import {UploadIcon} from '@heroicons/react/outline';
import * as React from 'react';
import { useRecoilValue } from 'recoil';
import { LoadingAtom, MediaFoldersAtom, SelectedMediaFolderAtom, SettingsSelector, ViewDataSelector } from '../../state';
import { Spinner } from '../Spinner';
import { SponsorMsg } from '../SponsorMsg';
import { Item } from './Item';
import { Lightbox } from './Lightbox';
import { List } from './List';
import { useDropzone } from 'react-dropzone'
import { useCallback, useEffect, useMemo } from 'react';
import { DashboardMessage } from '../../DashboardMessage';
import { FrontMatterIcon } from '../../../panelWebView/components/Icons/FrontMatterIcon';
import { FolderItem } from './FolderItem';
import useMedia from '../../hooks/useMedia';
import { STATIC_FOLDER_PLACEHOLDER, TelemetryEvent } from '../../../constants';
import { PageLayout } from '../Layout/PageLayout';
import { parseWinPath } from '../../../helpers/parseWinPath';
import { basename, extname, join } from 'path';
import { MediaInfo } from '../../../models';

export interface IMediaProps {}

export const Media: React.FunctionComponent<IMediaProps> = (props: React.PropsWithChildren<IMediaProps>) => {
  const { media } = useMedia();
  const settings = useRecoilValue(SettingsSelector);
  const viewData = useRecoilValue(ViewDataSelector);
  const selectedFolder = useRecoilValue(SelectedMediaFolderAtom);
  const folders = useRecoilValue(MediaFoldersAtom);
  const loading = useRecoilValue(LoadingAtom);

  const currentStaticFolder = useMemo(() => {
    if (settings?.staticFolder) {
      let staticFolderPath = join('/', settings?.staticFolder || '', '/');
      if (settings?.staticFolder === STATIC_FOLDER_PLACEHOLDER.hexo.placeholder) {
        staticFolderPath = join('/', STATIC_FOLDER_PLACEHOLDER.hexo.postsFolder, '/');
      }
      return staticFolderPath;
    }
    return;
  }, [settings?.staticFolder])

  const contentFolders = useMemo(() => {
    // Check if content allows page bundle or if Hexo post assets are enabled
    if (viewData && viewData.data && typeof viewData.data.pageBundle !== "undefined" && !viewData.data.pageBundle && settings?.staticFolder !== STATIC_FOLDER_PLACEHOLDER.hexo.placeholder) {
      return [];
    }

    const groupedFolders = [];

    for (const cFolder of (settings?.contentFolders || [])) {
      const foldersPath = parseWinPath(cFolder.path);
      groupedFolders.push({
        title: cFolder.title || basename(cFolder.path),
        folders: folders.filter(f => parseWinPath(f).startsWith(foldersPath))
      });
    }

    return groupedFolders;
  }, [folders, viewData, settings?.contentFolders, settings?.staticFolder]);

  const publicFolders = useMemo(() => {
    if (currentStaticFolder && settings?.staticFolder !== STATIC_FOLDER_PLACEHOLDER.hexo.placeholder) {
      return folders.filter(f => parseWinPath(f).includes(currentStaticFolder));
    }

    return undefined;
  }, [folders, viewData, currentStaticFolder, settings?.staticFolder]);

  const allMedia = useMemo(() => {
    let mediaFiles: MediaInfo[] = Object.assign([], media);
    // Check if content allows page bundle
    if (currentStaticFolder && viewData && viewData.data && typeof viewData.data.pageBundle !== "undefined" && !viewData.data.pageBundle) {
      mediaFiles = media.filter(m => parseWinPath(m.fsPath).includes(currentStaticFolder));
    }

    // Filter if Hexo post folder
    if (currentStaticFolder && settings?.staticFolder === STATIC_FOLDER_PLACEHOLDER.hexo.placeholder) {
      mediaFiles = mediaFiles.filter(m => parseWinPath(m.fsPath).includes(currentStaticFolder));
    }

    if (viewData && viewData.data && viewData.data.type === "file" && viewData.data.fileExtensions && viewData.data.fileExtensions.length > 0) {
      const supportedExtensions = viewData.data.fileExtensions;
      mediaFiles = mediaFiles.filter(m => {
        const ext = extname(m.fsPath);
        // Remove the dot from the extension
        const extWithoutDot = ext.substring(1);
        return supportedExtensions.includes(extWithoutDot);
      });
    }

    return mediaFiles;
  }, [media, viewData, currentStaticFolder, settings?.staticFolder]); 

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const contents = reader.result;
        Messenger.send(DashboardMessage.uploadMedia, {
          fileName: file.name,
          contents,
          folder: selectedFolder
        });
      };

      reader.readAsDataURL(file)
    });
  }, [selectedFolder]);

  useEffect(() => {
    Messenger.send(DashboardMessage.sendTelemetry, {
      event: TelemetryEvent.webviewMediaView
    });
  }, []);

  const {getRootProps, isDragActive} = useDropzone({
    onDrop,
    accept: settings?.dashboardState.media.mimeTypes || ['image/*', 'video/*', 'audio/*'],
    onDropRejected: () => {
      Messenger.send(DashboardMessage.showWarning, 'Unsupported file type');
    }
  });
  
  return (
    <PageLayout>
      <div className="w-full h-full pb-6" {...getRootProps()}>
        {
          viewData?.data?.filePath && (
            <div className={`text-lg text-center mb-6`}>
              <p>Select the media file to add to your content.</p>
              <p className={`opacity-80 text-base`}>You can also drag and drop images from your desktop and select them once uploaded.</p>
            </div>
          )
        }
        
        {
          isDragActive && (
            <div className="absolute top-0 left-0 w-full h-full text-whisper-500 bg-gray-900 bg-opacity-70 flex flex-col justify-center items-center z-50">
              <UploadIcon className={`h-32`} />
              <p className={`text-xl max-w-md text-center`}>
                {selectedFolder ? `Upload to ${selectedFolder}` : `No folder selected, files you drop will be added to the ${currentStaticFolder || "public"} folder.`}
              </p>
            </div>
          )
        }

        {
          (allMedia.length === 0 && folders.length === 0 && !loading) && (
            <div className={`flex items-center justify-center h-full`}>
              <div className={`max-w-xl text-center`}>
                <FrontMatterIcon className={`text-vulcan-300 dark:text-whisper-800 h-32 mx-auto opacity-90 mb-8`} />
                
                <p className={`text-xl font-medium`}>No media files to show. You can drag &amp; drop new files by holding your [shift] key.</p>
              </div>
            </div>
          )
        }

        {
          contentFolders && contentFolders.length > 0 && contentFolders.map((group, idx) => (
            group.folders && group.folders.length > 0 && (
              <div key={`group-${idx}`} className={`mb-8`}>
                <h2 className='text-lg mb-8 first-letter:uppercase'>Content folder: <b>{group.title}</b></h2>

                <List gap={0}>
                  {
                    group.folders.map((folder) => (
                      <FolderItem key={folder} folder={folder} staticFolder={currentStaticFolder} wsFolder={settings?.wsFolder} />
                    ))
                  }
                </List>
              </div>
            )
          ))
        }

        {
          publicFolders && publicFolders.length > 0 && (
            <div className={`mb-8`}>
              {
                contentFolders && contentFolders.length > 0 && (<h2 className='text-lg mb-8'>Public folder{currentStaticFolder && (<span>: <b>{currentStaticFolder}</b></span>)}</h2>)
              }

              <List gap={0}>
                {
                  publicFolders.map((folder) => (
                    <FolderItem key={folder} folder={folder} staticFolder={currentStaticFolder} wsFolder={settings?.wsFolder} />
                  ))
                }
              </List>
            </div>
          )
        }

        <List>
          {
            allMedia.map((file) => (
              <Item key={file.fsPath} media={file} />
            ))
          }
        </List>
      </div>

      {
        loading && ( <Spinner /> )
      }

      <Lightbox />

      <SponsorMsg beta={settings?.beta} version={settings?.versionInfo} isBacker={settings?.isBacker} />
    </PageLayout>
  );
};