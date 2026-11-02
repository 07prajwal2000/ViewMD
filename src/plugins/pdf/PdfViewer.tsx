import React, { useEffect, useState } from 'react';
import type { ViewerProps } from '../../types/plugin';

export const PdfViewer: React.FC<ViewerProps> = ({ tab }) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;

    if (tab.content instanceof Blob) {
      url = URL.createObjectURL(tab.content);
      setBlobUrl(url);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [tab.content]);

  if (!blobUrl) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-400">
        Loading PDF...
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-100 dark:bg-gray-900 flex flex-col">
      <iframe
        src={blobUrl}
        title={tab.name}
        className="w-full h-full border-none"
      />
    </div>
  );
};
