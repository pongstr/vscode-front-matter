import { SearchIcon, XCircleIcon } from '@heroicons/react/outline';
import * as React from 'react';

export interface IFilterInputProps {
  placeholder: string;
  value: string;
  isReady: boolean;
  autoFocus: boolean;
  onReset?: () => void;
  onChange: (value: string) => void;
}

export const FilterInput: React.FunctionComponent<IFilterInputProps> = ({
  placeholder,
  value,
  isReady,
  autoFocus,
  onReset,
  onChange
}: React.PropsWithChildren<IFilterInputProps>) => {
  return (
    <div className="flex space-x-4 flex-1">
      <div className="min-w-0">
        <label htmlFor="search" className="sr-only">
          Search
        </label>
        <div className="relative flex justify-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>

          <input
            type="text"
            name="search"
            className={`block w-full py-2 pl-10 pr-3 sm:text-sm bg-white dark:bg-vulcan-300 border border-gray-300 dark:border-vulcan-100 text-vulcan-500 dark:text-whisper-500 placeholder-gray-400 dark:placeholder-whisper-800 focus:outline-none appearance-none disabled:opacity-50`}
            placeholder={placeholder || 'Search'}
            value={value}
            autoFocus={autoFocus}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
            disabled={!isReady}
          />

          {value && onReset && (
            <button onClick={onReset} className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <XCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
