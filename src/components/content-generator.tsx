'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, FileImage, Sparkles, Search, KeyRound, Globe, BookUp } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateFromCommentAction, generateFromPhotoAction, improvePostAction } from '@/lib/actions';
import { searchWordPressPostsAction } from '@/lib/wp-actions';
import type { GeneratedContent, WpPost, WpConnection } from '@/lib/types';
import { Separator } from './ui/separator';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useUser, useFirestore, useCollection, useLanguage } from '@/firebase';
import { addHistoryEvent } from '@/lib/history';
import { addOrUpdateConnection } from '@/lib/connections';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useMemoFirebase } from '@/hooks/use-memo-firebase';
import { collection, query, orderBy } from 'firebase/firestore';


const commentSchema = z.object({
  comment: z.string().min(10, 'Please enter a comment of at least 10 characters.'),
});

const photoSchema = z.object({
  photo: z.any().refine((file) => file?.length == 1, 'Photo is required.'),
});

const improveSchema = z.object({
  existingPost: z.string().min(10, 'Please enter existing content of at least 10 characters.'),
  desiredStyle: z.string().min(5, 'Please enter a desired style of at least 5 characters.'),
});

type ContentGeneratorProps = {
  onContentGenerated: (content: GeneratedContent, source: 'comment' | 'photo' | 'improve', photoUrl?: string) => void;
};

export function ContentGenerator({ onContentGenerated }: ContentGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('comment');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { t } = useLanguage();

  // State for WP Search
  const [isSearching, setIsSearching] = useState(false);
  const [wpUrl, setWpUrl] = useState('');
  const [wpUsername, setWpUsername] = useState('');
  const [wpAppPassword, setWpAppPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WpPost[]>([]);
  const [postIdToUpdate, setPostIdToUpdate] = useState<string | undefined>(undefined);
  const [postType, setPostType] = useState<'posts' | 'pages'>('posts');
  
  // Fetch connections
  const connectionsQuery = useMemoFirebase(() => {
      if (userLoading || !user || !firestore) return null;
      return query(collection(firestore, `users/${user.uid}/connections`), orderBy('lastUsed', 'desc'));
  }, [user, firestore, userLoading]);
  const { data: connections } = useCollection<WpConnection>(connectionsQuery);

  const commentForm = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: { comment: '' },
  });

  const photoForm = useForm<z.infer<typeof photoSchema>>({
    resolver: zodResolver(photoSchema),
  });

  const improveForm = useForm<z.infer<typeof improveSchema>>({
    resolver: zodResolver(improveSchema),
    defaultValues: { existingPost: '', desiredStyle: '' },
  });

  const handleCommentSubmit: SubmitHandler<z.infer<typeof commentSchema>> = async (data) => {
    setIsLoading(true);
    try {
      const result = await generateFromCommentAction(data.comment);
      onContentGenerated(result, 'comment');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSubmit: SubmitHandler<z.infer<typeof photoSchema>> = async (data) => {
    setIsLoading(true);
    const file = data.photo[0];
    if (!file) {
      setIsLoading(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      if (!dataUri) {
        toast({ variant: 'destructive', title: 'Could not read file.' });
        setIsLoading(false);
        return;
      }

      try {
        const result = await generateFromPhotoAction(dataUri);
        onContentGenerated(result, 'photo', dataUri);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'An error occurred',
          description: error instanceof Error ? error.message : 'Please try again later.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error reading file.' });
        setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };
  
  const handleImproveSubmit: SubmitHandler<z.infer<typeof improveSchema>> = async (data) => {
    setIsLoading(true);
    try {
      const result = await improvePostAction(data.existingPost, data.desiredStyle);
      onContentGenerated({ ...result, postId: postIdToUpdate, postType: postType }, 'improve');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(file){
        const url = URL.createObjectURL(file);
        setPhotoPreview(url);
    } else {
        setPhotoPreview(null);
    }
  }

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchResults([]);
    try {
        const results = await searchWordPressPostsAction(searchQuery, wpUrl, wpUsername, wpAppPassword, postType);
        setSearchResults(results);
        
        if (results.length > 0 && user && firestore) {
            addOrUpdateConnection(firestore, user.uid, { wpUrl, wpUsername });
            addHistoryEvent(firestore, user.uid, {
                type: 'connection',
                details: {
                    wpUrl: wpUrl,
                    wpUsername: wpUsername,
                }
            });
        }
        
        if (results.length === 0) {
            toast({ title: "No results found." });
        }
    } catch(error) {
        toast({
            variant: "destructive",
            title: "Search failed",
            description: error instanceof Error ? error.message : "Could not perform search.",
        });
    } finally {
        setIsSearching(false);
    }
  }

  const handleSelectPost = (post: WpPost) => {
    improveForm.setValue('existingPost', post.content.rendered);
    setPostIdToUpdate(post.id.toString());
    toast({ title: "Post loaded", description: `"${post.title.rendered}" is ready to be improved.` });
  }

  const handleSelectConnection = (connectionId: string) => {
    const conn = connections?.find(c => c.id === connectionId);
    if (conn) {
        setWpUrl(conn.wpUrl);
        setWpUsername(conn.wpUsername);
    }
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="h-6 w-6 text-accent" />
          Create Your Content
        </CardTitle>
        <CardDescription>
          Choose your source and let AI craft a WordPress post for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comment">From Comment</TabsTrigger>
            <TabsTrigger value="photo">From Photo</TabsTrigger>
            <TabsTrigger value="improve">Improve Post</TabsTrigger>
          </TabsList>
          <TabsContent value="comment">
            <Form {...commentForm}>
              <form onSubmit={commentForm.handleSubmit(handleCommentSubmit)} className="space-y-6 pt-4">
                <FormField
                  control={commentForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your comment or idea</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g., 'Write a blog post about the benefits of remote work for small businesses...'"
                          className="min-h-[150px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && activeTab === 'comment' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>Generate Content</>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="photo">
             <Form {...photoForm}>
              <form onSubmit={photoForm.handleSubmit(handlePhotoSubmit)} className="space-y-6 pt-4">
                <FormField
                  control={photoForm.control}
                  name="photo"
                  render={({ field: { onChange, onBlur, name, ref } }) => (
                    <FormItem>
                      <FormLabel>Upload a photo</FormLabel>
                      <FormControl>
                        <div className="flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                            <div className="text-center">
                                {photoPreview ? (
                                    <Image src={photoPreview} alt="Photo preview" width={200} height={200} className="mx-auto mb-4 h-32 w-auto rounded-md object-cover" />
                                ) : (
                                    <FileImage className="mx-auto h-12 w-12 text-muted-foreground" />
                                )}
                                <div className="mt-4 flex justify-center text-sm leading-6 text-muted-foreground">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                                    >
                                        <span>Upload a file</span>
                                        <input id="file-upload" name={name} ref={ref} onBlur={onBlur} type="file" className="sr-only" accept="image/*" onChange={(e) => {
                                            onChange(e.target.files);
                                            onPhotoChange(e);
                                        }} />
                                    </label>
                                    <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && activeTab === 'photo' ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <>Generate Content</>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          <TabsContent value="improve">
            <div className="space-y-6 pt-4">
                <Card>
                    <CardHeader>
                        <CardTitle className='text-lg flex items-center gap-2'><BookUp className="h-5 w-5"/>Load from WordPress</CardTitle>
                        <CardDescription>Connect to your site to search for content, or load from saved connections.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {connections && connections.length > 0 && (
                             <div className="space-y-2">
                                <Label>Saved Connections</Label>
                                <Select onValueChange={handleSelectConnection}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a saved connection..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {connections.map(c => (
                                            <SelectItem key={c.id} value={c.id!}>{c.wpUsername} @ {c.wpUrl}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="wp-url-search">WordPress Site URL</Label>
                                <Input id="wp-url-search" placeholder="https://example.com" value={wpUrl} onChange={(e) => setWpUrl(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wp-username-search">Username</Label>
                                <Input id="wp-username-search" placeholder="your-wp-username" value={wpUsername} onChange={(e) => setWpUsername(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="wp-app-password-search">Application Password</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="wp-app-password-search" type="password" placeholder="xxxx xxxx xxxx xxxx" className="pl-9" value={wpAppPassword} onChange={(e) => setWpAppPassword(e.target.value)} />
                            </div>
                        </div>
                        
                        <Separator />
                        
                        <div className='space-y-2'>
                            <Label>Search for content on your site:</Label>
                             <RadioGroup value={postType} onValueChange={(value: 'posts' | 'pages') => setPostType(value)} className="flex items-center">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="posts" id="r-posts" />
                                    <Label htmlFor="r-posts">{t('postTypePost')}</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="pages" id="r-pages" />
                                    <Label htmlFor="r-pages">{t('postTypePage')}</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="flex items-center gap-2">
                            <Input placeholder="Search by keyword..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            <Button onClick={handleSearch} disabled={isSearching || !searchQuery}>
                                {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                                <span className='sm:inline hidden ml-2'>Search</span>
                            </Button>
                        </div>
                        {searchResults.length > 0 && (
                            <ScrollArea className="h-40 rounded-md border">
                                <div className='p-2 space-y-2'>
                                {searchResults.map(post => (
                                    <button key={post.id} onClick={() => handleSelectPost(post)} className='w-full text-left p-2 rounded-md hover:bg-accent hover:text-accent-foreground'>
                                        <p className="font-semibold" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                                        <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
                                    </button>
                                ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                <Separator />

                <Form {...improveForm}>
                <form onSubmit={improveForm.handleSubmit(handleImproveSubmit)} className="space-y-6">
                    <FormField
                    control={improveForm.control}
                    name="existingPost"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Existing Content</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Paste your existing blog post or text here..."
                            className="min-h-[200px] resize-y"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={improveForm.control}
                    name="desiredStyle"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Desired Style or Instructions</FormLabel>
                        <FormControl>
                            <Input
                            placeholder="e.g., 'Make it more professional', 'Rewrite this based on the attached audio transcription...'"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && activeTab === 'improve' ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        <>Improve Content</>
                    )}
                    </Button>
                </form>
                </Form>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
