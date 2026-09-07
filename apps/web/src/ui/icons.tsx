interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export type IconName =
  | 'folder'
  | 'file'
  | 'chevron-right'
  | 'chevron-down'
  | 'search'
  | 'upload'
  | 'download'
  | 'more'
  | 'check'
  | 'close'
  | 'trash'
  | 'share'
  | 'grid'
  | 'list'
  | 'sun'
  | 'moon'
  | 'user'
  | 'plus'
  | 'lock'
  | 'shield'
  | 'panel'
  | 'camera'
  | 'info';

const PATHS: Record<IconName, string> = {
  folder: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  file: 'M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v4h4',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3',
  upload: 'M12 16V4M6 10l6-6 6 6M4 20h16',
  download: 'M12 4v12M6 10l6 6 6-6M4 20h16',
  more: 'M12 5h.01M12 12h.01M12 19h.01',
  check: 'M5 12l5 5L20 6',
  close: 'M6 6l12 12M18 6L6 18',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  share: 'M8 12a3 3 0 1 0 0-.01M16 6a3 3 0 1 0 0-.01M16 18a3 3 0 1 0 0-.01M10.6 10.7l4.8-2.9M10.6 13.3l4.8 2.9',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6L4.5 4.5M19.5 19.5 18 18M18 6l1.5-1.5M4.5 19.5 6 18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 21a7 7 0 0 1 14 0',
  plus: 'M12 5v14M5 12h14',
  lock: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  panel: 'M4 5h16v14H4zM15 5v14',
  camera: 'M4 8h4l2-2h4l2 2h4v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8h.01M11 12h1v4h1',
};

export function Icon({ name, size = 18, className }: IconProps): JSX.Element {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
