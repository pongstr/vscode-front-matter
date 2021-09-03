import { Menu } from '@headlessui/react';
import * as React from 'react';
import { SortOption } from '../../constants/SortOption';
import { MenuButton, MenuItem, MenuItems } from '../Menu';

export interface ISortingProps {
  currentSorting: SortOption;
  
  switchSorting: (sortId: SortOption) => void;
}

export const sortOptions = [
  { name: "Last modified", id: SortOption.LastModified },
  { name: "By filename (asc)", id: SortOption.FileNameAsc },
  { name: "By filename (desc)", id: SortOption.FileNameDesc },
];

export const Sorting: React.FunctionComponent<ISortingProps> = ({currentSorting, switchSorting}: React.PropsWithChildren<ISortingProps>) => {

  const crntSort = sortOptions.find(x => x.id === currentSorting);

  return (
    <div className="flex items-center">
      <Menu as="div" className="relative z-10 inline-block text-left">
        <MenuButton label={`Sort by`} title={crntSort?.name || ""} />

        <MenuItems>
          {sortOptions.map((option) => (
            <MenuItem 
              key={option.id}
              title={option.name}
              value={option.id}
              isCurrent={option.id === currentSorting}
              onClick={switchSorting} />
          ))}
        </MenuItems>
      </Menu>
    </div>
  );
};