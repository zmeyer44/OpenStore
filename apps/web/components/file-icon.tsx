import {
  File,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  FileCode,
  FileSpreadsheet,
  Presentation,
  Folder,
} from 'lucide-react';
import { getFileCategory } from '@locker/common';
import { cn } from '@/lib/utils';
import { getFileExtension } from '@/lib/utils';

const EXTENSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ts: FileCode,
  tsx: FileCode,
  js: FileCode,
  jsx: FileCode,
  py: FileCode,
  go: FileCode,
  rs: FileCode,
  rb: FileCode,
  java: FileCode,
  html: FileCode,
  css: FileCode,
  json: FileCode,
  xml: FileCode,
  yaml: FileCode,
  yml: FileCode,
  md: FileText,
  txt: FileText,
  csv: FileSpreadsheet,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  ppt: Presentation,
  pptx: Presentation,
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  document: FileText,
  video: Video,
  audio: Music,
  archive: Archive,
  other: File,
};

export function FileIcon({
  name,
  mimeType,
  isFolder,
  className,
}: {
  name: string;
  mimeType?: string;
  isFolder?: boolean;
  className?: string;
}) {
  if (isFolder) {
    return <Folder className={cn('text-primary', className)} />;
  }

  const ext = getFileExtension(name);
  const ExtIcon = EXTENSION_ICONS[ext];
  if (ExtIcon) {
    return <ExtIcon className={cn('text-muted-foreground', className)} />;
  }

  const category = getFileCategory(mimeType ?? 'application/octet-stream');
  const CatIcon = CATEGORY_ICONS[category] ?? File;

  const colorMap: Record<string, string> = {
    image: 'text-purple-500',
    video: 'text-pink-500',
    audio: 'text-amber-500',
    archive: 'text-orange-500',
    document: 'text-blue-500',
    other: 'text-muted-foreground',
  };

  return <CatIcon className={cn(colorMap[category], className)} />;
}
