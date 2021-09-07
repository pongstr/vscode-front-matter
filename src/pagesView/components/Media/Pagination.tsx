import { Messenger } from '@estruyf/vscode/dist/client';
import * as React from 'react';
import { useRecoilValue } from 'recoil';
import { DashboardMessage } from '../../DashboardMessage';
import { MediaTotalSelector, SelectedMediaFolderSelector } from '../../state';
import { FolderSelection } from './FolderSelection';
import { LIMIT } from './Media';
import { PaginationButton } from './PaginationButton';

export interface IPaginationProps {}

export const Pagination: React.FunctionComponent<IPaginationProps> = ({}: React.PropsWithChildren<IPaginationProps>) => {
  const selectedFolder = useRecoilValue(SelectedMediaFolderSelector);
  const totalMedia = useRecoilValue(MediaTotalSelector);
  const [ page, setPage ] = React.useState<number>(0);
  
  const totalPages = Math.ceil(totalMedia / LIMIT) - 1;

  const getTotalPage = () => {
    const mediaItems = ((page + 1) * LIMIT);
    if (totalMedia < mediaItems) {
      return totalMedia;
    }
    return mediaItems;
  };

  // Write me function to retrieve buttons before and after current page
  const getButtons = (): number[] => {
    const maxButtons = 5;
    const buttons: number[] = [];
    const start = page - maxButtons;
    const end = page + maxButtons;

    for (let i = start; i <= end; i++) {
      if (i >= 0 && i <= totalPages) {
        buttons.push(i);
      }
    }
    return buttons;
  };

  const buttons = getButtons();

  React.useEffect(() => {
    Messenger.send(DashboardMessage.getMedia, {
      page,
      folder: selectedFolder || ''
    });
  }, [page]);

  React.useEffect(() => {
    Messenger.send(DashboardMessage.getMedia, {
      page: 0,
      folder: selectedFolder || ''
    });
    setPage(0);
  }, [selectedFolder]);

  return (
    <nav
      className="py-4 px-5 flex items-center justify-between bg-gray-200 border-b border-gray-300 dark:bg-vulcan-400  dark:border-vulcan-100"
      aria-label="Pagination"
    >
      <div className="hidden sm:block">
        <p className="text-sm text-gray-500 dark:text-whisper-900">
          Showing <span className="font-medium">{(page * LIMIT) + 1}</span> to <span className="font-medium">{getTotalPage()}</span> of{' '}
          <span className="font-medium">{totalMedia}</span> results
        </p>
      </div>

      <FolderSelection />

      <div className="flex justify-between sm:justify-end space-x-2 text-sm">
        <PaginationButton
          title="First"
          disabled={page === 0}
          onClick={() => {
            if (page > 0) {
              setPage(0)
            }
          }} />

        <PaginationButton
          title="Previous"
          disabled={page === 0}
          onClick={() => {
            if (page > 0) {
              setPage(page - 1)
            }
          }} />
        
        {buttons.map((button) => (
          <button
            key={button}
            disabled={button === page}
            onClick={() => {
              setPage(button)
            }
            }
            className={`${page === button ? 'bg-gray-200 px-2 text-vulcan-500' : 'text-gray-500 hover:text-gray-600 dark:text-whisper-900 dark:hover:text-whisper-500'}`}
          >{button + 1}</button>
        ))}

        <PaginationButton
          title="Next"
          disabled={page >= totalPages}
          onClick={() => setPage(page + 1)} />

        <PaginationButton
          title="Last"
          disabled={page >= totalPages}
          onClick={() => setPage(totalPages)} />
      </div>
    </nav>
  );
};