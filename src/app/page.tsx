'use client';

import { useState } from 'react';
import { useUser, useAuth, useLanguage } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Languages, LogOut, History, Shield } from 'lucide-react';
import { Icons } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { ContentGenerator } from '@/components/content-generator';
import { ContentPreview } from '@/components/content-preview';
import { HistoryDialog } from '@/components/history-dialog';
import type { GeneratedContent } from '@/lib/types';
import Link from 'next/link';

// Main App component when logged in
function AppView() {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generationSource, setGenerationSource] = useState<'comment' | 'photo' | 'improve' | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleContentGenerated = (
    content: GeneratedContent,
    source: 'comment' | 'photo' | 'improve',
    photoUrl?: string
  ) => {
    setGeneratedContent(content);
    setGenerationSource(source);
    if (photoUrl) {
      setPhotoPreview(photoUrl);
    } else {
      setPhotoPreview(null);
    }
    window.scrollTo(0, 0);
  };

  const handleReset = () => {
    setGeneratedContent(null);
    setGenerationSource(null);
    setPhotoPreview(null);
  };

  return (
    <div className="container mx-auto py-8 md:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        {!generatedContent ? (
          <ContentGenerator onContentGenerated={handleContentGenerated} />
        ) : (
          <ContentPreview
            content={generatedContent}
            onReset={handleReset}
            source={generationSource}
            photoPreview={photoPreview}
          />
        )}
      </div>
    </div>
  );
}

// Login component when logged out
function LoginView() {
  const auth = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Firebase Auth is not initialized.',
      });
      return;
    }
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // useUser hook will handle the state change and re-render
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.code === 'auth/popup-closed-by-user' 
          ? 'The login window was closed.'
          : error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-[calc(100vh-10rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t('welcome')}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('loginToContinue')}</p>
        <Button onClick={handleLogin} disabled={isLoading} className="mt-8" size="lg">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {t('login')}
        </Button>
      </div>
    </div>
  );
}

// Main Page component that decides which view to show
export default function Home() {
  const { user, loading: userLoading, signOut } = useUser();
  const { t, setLanguage, language } = useLanguage();
  const [historyOpen, setHistoryOpen] = useState(false);

  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Icons.logo className="h-6 w-6" />
              <span className="font-bold">
                {t('appTitle')}
              </span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <nav className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Languages className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
                  <DropdownMenuItem onSelect={() => setLanguage('en')} disabled={language === 'en'}>English</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setLanguage('es')} disabled={language === 'es'}>Español</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback>
                          {user.displayName?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setHistoryOpen(true)}>
                      <History className="mr-2 h-4 w-4" />
                      <span>{t('history')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>{t('adminPanel')}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('logout')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">{user ? <AppView /> : <LoginView />}</main>

      <footer className="border-t">
        <div className="container flex h-14 items-center justify-center">
          <p className="text-sm text-muted-foreground">{t('footerText')}</p>
        </div>
      </footer>

      <HistoryDialog open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
