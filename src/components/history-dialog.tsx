'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser, useCollection, useFirestore, useLanguage } from '@/firebase';
import type { HistoryEvent } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';
import { Link, Edit, Globe, AlertCircle } from 'lucide-react';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';

type HistoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function HistoryItem({ event, locale }: { event: HistoryEvent, locale: Locale }) {
  const { type, details, timestamp } = event;

  const timeAgo = timestamp
    ? formatDistanceToNow(timestamp.toDate(), { addSuffix: true, locale })
    : 'just now';

  const renderDetails = () => {
    switch (type) {
      case 'creation':
      case 'edition':
        return (
          <>
            <p className="font-semibold truncate">{details.postTitle}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>{details.wpUrl}</span>
            </div>
            {details.postUrl && (
              <a
                href={details.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Link className="h-3 w-3" />
                View Post
              </a>
            )}
          </>
        );
      case 'connection':
        return (
          <>
            <p className="font-semibold">Connected to WordPress</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>{details.wpUrl}</span>
            </div>
             <p className="text-xs text-muted-foreground">as {details.wpUsername}</p>
          </>
        );
      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'creation':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'edition':
        return <Edit className="h-4 w-4 text-blue-500" />;
      case 'connection':
        return <Globe className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  }

  return (
    <div className="flex items-start gap-4 p-3 hover:bg-muted/50 rounded-lg">
      <div className="mt-1">{getIcon()}</div>
      <div className="flex-1 space-y-1">
        {renderDetails()}
      </div>
      <div className="text-xs text-muted-foreground shrink-0">{timeAgo}</div>
    </div>
  );
}

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { t, language } = useLanguage();
  const locale = language === 'es' ? es : enUS;

  const historyQuery = useMemoFirebase(() => {
    if (userLoading || !user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/history`),
      orderBy('timestamp', 'desc')
    );
  }, [user, firestore, userLoading]);

  const { data: history, loading: historyLoading, error } = useCollection<HistoryEvent>(historyQuery);
  const isLoading = userLoading || historyLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('historyTitle')}</DialogTitle>
          <DialogDescription>
            {t('historyDescription')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96 pr-4 -mr-4">
          <div className="space-y-2">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            
            {!isLoading && error && (
                <div className="text-center py-12 text-destructive">
                    <AlertCircle className="mx-auto h-8 w-8" />
                    <p className="mt-4 font-semibold">{t('historyErrorTitle')}</p>
                    <p className="text-sm text-muted-foreground">
                        {t('historyErrorDescription')}
                    </p>
                </div>
            )}

            {!isLoading && !error && history && history.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>{t('historyEmpty')}</p>
                <p className="text-sm">{t('historyEmptyDescription')}</p>
              </div>
            )}
            {!isLoading && !error && history && history.map((event) => (
              <HistoryItem key={event.id} event={event} locale={locale} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
