import { Messenger } from '@estruyf/vscode/dist/client';
import { EventData } from '@estruyf/vscode/dist/models';
import { useState, useEffect, useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { MediaInfo, MediaPaths } from '../../models';
import { DashboardCommand } from '../DashboardCommand';
import {
  AllContentFoldersAtom,
  AllStaticFoldersAtom,
  LoadingAtom,
  MediaFoldersAtom,
  MediaTotalAtom,
  PageAtom,
  SearchAtom,
  SelectedMediaFolderAtom,
  SettingsAtom
} from '../state';
import Fuse from 'fuse.js';
import usePagination from './usePagination';

const fuseOptions: Fuse.IFuseOptions<MediaInfo> = {
  keys: [
    { name: 'filename', weight: 0.8 },
    { name: 'fsPath', weight: 0.5 },
    { name: 'caption', weight: 0.5 },
    { name: 'alt', weight: 0.5 }
  ],
  threshold: 0.2,
  includeScore: true
};

export default function useMedia() {
  const [media, setMedia] = useState<MediaInfo[]>([]);
  const page = useRecoilValue(PageAtom);
  const [searchedMedia, setSearchedMedia] = useState<MediaInfo[]>([]);
  const [, setSelectedFolder] = useRecoilState(SelectedMediaFolderAtom);
  const [, setTotal] = useRecoilState(MediaTotalAtom);
  const [, setFolders] = useRecoilState(MediaFoldersAtom);
  const [, setAllContentFolders] = useRecoilState(AllContentFoldersAtom);
  const [, setAllStaticFolders] = useRecoilState(AllStaticFoldersAtom);
  const [, setLoading] = useRecoilState(LoadingAtom);
  const search = useRecoilValue(SearchAtom);
  const settings = useRecoilValue(SettingsAtom);
  const { pageSetNr } = usePagination(settings?.dashboardState.contents.pagination);

  const getMedia = useCallback(() => {
    return searchedMedia.slice(page * pageSetNr, (page + 1) * pageSetNr);
  }, [searchedMedia, page, pageSetNr]);

  const messageListener = (
    message: MessageEvent<EventData<MediaPaths | { key: string; value: any }>>
  ) => {
    if (message.data.command === DashboardCommand.media) {
      const data: MediaPaths = message.data.data as MediaPaths;
      setLoading(false);
      setMedia(data.media);
      setTotal(data.total);
      setFolders(data.folders);
      setSelectedFolder(data.selectedFolder);
      setSearchedMedia(data.media);
      setAllContentFolders(data.allContentFolders);
      setAllStaticFolders(data.allStaticfolders);
    }
  };

  useEffect(() => {
    if (search) {
      const fuse = new Fuse(media, fuseOptions);
      const results = fuse.search(search);
      const newSearchedMedia = results.map((page) => page.item);

      setSearchedMedia(newSearchedMedia);
      setTotal(results.length);

      return;
    }

    setTotal(media.length);
    setSearchedMedia(media);
  }, [search, media]);

  useEffect(() => {
    Messenger.listen<MediaPaths>(messageListener);

    return () => {
      Messenger.unlisten(messageListener);
    };
  }, []);

  return {
    media: getMedia()
  };
}
