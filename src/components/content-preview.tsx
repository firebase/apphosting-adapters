'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import type { GeneratedContent } from '@/lib/types';
import { publishToWordPressAction } from '@/lib/wp-actions';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Send, RefreshCw, X, Clock, KeyRound, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useUser, useFirestore, useLanguage } from '@/firebase';
import { addHistoryEvent } from '@/lib/history';

type ContentPreviewProps = {
  content: GeneratedContent;
  onReset: () => void;
  source: 'comment' | 'photo' | 'improve' | null;
  photoPreview: string | null;
};

export function ContentPreview({ content, onReset, source, photoPreview }: ContentPreviewProps) {
  const [editedContent, setEditedContent] = useState<GeneratedContent>(content);
  const [tagInput, setTagInput] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  
  const { user } = useUser();
  const firestore = useFirestore();
  const { t } = useLanguage();

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handlePublish = async () => {
    setIsPublishing(true);
    toast({
      title: 'Publishing to WordPress...',
      description: 'Please wait while we connect to your site.',
    });
    try {
      const result = await publishToWordPressAction(editedContent, wpUrl, wpUsername, wpAppPassword);
      toast({
        title: 'Success!',
        description: (
            <>
              Your post has been {editedContent.postId ? 'updated' : 'published'}.
              <a href={result.postUrl} target="_blank" rel="noopener noreferrer" className="underline ml-2">View Post</a>
            </>
        ),
      });

      if (user && firestore) {
          addHistoryEvent(firestore, user.uid, {
              type: editedContent.postId ? 'edition' : 'creation',
              details: {
                  postUrl: result.postUrl,
                  postId: result.postId,
                  postTitle: editedContent.title,
                  wpUrl: wpUrl,
                  wpUsername: wpUsername,
                  postType: editedContent.postType || 'posts',
              }
          });
      }

    } catch(error) {
       toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: (
          <div className="mt-4 rounded-md border border-red-500/50 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-200">
            <h3 className="font-semibold">Publication Failed</h3>
            <div className="mt-2 text-sm">
                <p>The final error details are being sent to your hosting provider's support team for further investigation. Please copy the following message and send it to them in a support ticket.</p>
            </div>
          </div>
        ),
        duration: 600000,
      });
    } finally {
        setIsPublishing(false);
    }
  };
  
  const handleSchedule = () => {
    if (!date) {
        toast({ variant: 'destructive', title: 'Please select a date to schedule.'});
        return;
    }
    toast({
      title: 'Scheduling Post',
      description: `Your post will be published on ${format(date, 'PPP')}.`,
    });
    // Placeholder for scheduling logic
  };
  
  const handleAddTag = () => {
    if (tagInput && !editedContent.tags.includes(tagInput.trim())) {
      setEditedContent({ ...editedContent, tags: [...editedContent.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedContent({
      ...editedContent,
      tags: editedContent.tags.filter(tag => tag !== tagToRemove),
    });
  };

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Your Generated Post</h2>
            <Button variant="outline" onClick={onReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start New
            </Button>
        </div>

      {source === 'photo' && photoPreview && (
        <Card>
            <CardHeader>
                <CardTitle>Source Image</CardTitle>
            </CardHeader>
            <CardContent>
                <Image
                src={photoPreview}
                alt="Source for generated content"
                width={700}
                height={400}
                className="w-full rounded-lg object-cover"
                data-ai-hint="abstract texture"
                />
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Content Editor</CardTitle>
          <CardDescription>Review, edit, and publish your AI-generated content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div>
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    value={editedContent.title}
                    onChange={(e) => setEditedContent({ ...editedContent, title: e.target.value })}
                    className="text-lg font-semibold"
                />
            </div>
            <div>
                <Label htmlFor="body">Body</Label>
                <Textarea
                    id="body"
                    value={editedContent.body}
                    onChange={(e) => setEditedContent({ ...editedContent, body: e.target.value })}
                    className="min-h-[300px] resize-y"
                />
            </div>
            {(editedContent.postType === 'posts' || !editedContent.postType) && (
              <div>
                  <Label htmlFor="tags">Tags</Label>
                  <div className="flex items-center gap-2">
                      <Input
                          id="tags"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          placeholder="Add a tag and press Enter"
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                      {editedContent.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-sm">
                              {tag}
                              <button onClick={() => handleRemoveTag(tag)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20">
                                  <X className="h-3 w-3" />
                              </button>
                          </Badge>
                      ))}
                  </div>
              </div>
            )}
        </CardContent>
        <Separator className="my-4"/>
        <CardFooter className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn("w-full sm:w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a publish date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                </Popover>
                 <Button onClick={handleSchedule} disabled={!date} variant="secondary">
                    <Clock className="mr-2 h-4 w-4" />
                    Schedule
                </Button>
            </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-6 w-6" />
            Publish to WordPress
          </CardTitle>
          <CardDescription>
            Enter your WordPress site details to publish or update content.
            You'll need to create an <a href="https://wordpress.org/documentation/article/application-passwords/" target="_blank" rel="noopener noreferrer" className="underline">Application Password</a>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
              <Label>Content Type</Label>
              <RadioGroup
                value={editedContent.postType || 'posts'}
                onValueChange={(value: 'posts' | 'pages') => setEditedContent({...editedContent, postType: value})}
                className="flex space-x-4"
                disabled={!!editedContent.postId}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="posts" id="c-posts" />
                  <Label htmlFor="c-posts">{t('postTypePost')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pages" id="c-pages" />
                  <Label htmlFor="c-pages">{t('postTypePage')}</Label>
                </div>
              </RadioGroup>
              {editedContent.postId && <p className="text-xs text-muted-foreground">Cannot change content type when updating an existing item.</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="wp-url">WordPress Site URL</Label>
                <Input id="wp-url" placeholder="https://example.com" value={wpUrl} onChange={(e) => setWpUrl(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="wp-postid">Post ID (for updates)</Label>
                <Input id="wp-postid" placeholder="123" value={editedContent.postId || ''} onChange={(e) => setEditedContent({...editedContent, postId: e.target.value})} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="wp-username">Username</Label>
                <Input id="wp-username" placeholder="your-wp-username" value={wpUsername} onChange={(e) => setWpUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="wp-app-password">Application Password</Label>
                <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="wp-app-password" type="password" placeholder="xxxx xxxx xxxx xxxx" value={wpAppPassword} onChange={(e) => setWpAppPassword(e.target.value)} />
                </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handlePublish} disabled={isPublishing} className="w-full sm:w-auto ml-auto">
            {isPublishing ? <Loader2 className="animate-spin" /> : (editedContent.postId ? 'Update Post' : 'Publish New Post')}
          </Button>
        </CardFooter>
      </Card>

    </div>
  );
}
