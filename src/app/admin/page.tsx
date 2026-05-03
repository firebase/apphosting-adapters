'use client';

import { ArrowLeft, Shield, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <Button asChild variant="outline">
            <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to App
            </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-6 w-6" />
            Admin Panel Functionality
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This page is a placeholder for user management functionality. Listing all users from the client is disabled by default for security reasons.
          </p>
          <div className="rounded-lg border border-blue-500/50 bg-blue-50 p-4 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
            <h3 className="font-semibold">How to Implement This Securely</h3>
            <p className="mt-2 text-sm">
              To build a secure admin panel, you should use Firebase's server-side features:
            </p>
            <ol className="mt-2 list-decimal pl-5 text-sm space-y-1">
              <li>
                <strong>Custom Claims:</strong> Assign an `admin: true` custom claim to trusted users using the Firebase Admin SDK (typically in a Cloud Function).
              </li>
              <li>
                <strong>Security Rules:</strong> Update your Firestore security rules to only allow users with the `admin: true` claim to list all documents in the `/users` collection.
              </li>
              <li>
                <strong>Backend Logic:</strong> For advanced user management (like deleting users or changing roles), create secure Cloud Functions that can be called from this admin panel.
              </li>
            </ol>
          </div>
          <p className="text-sm text-muted-foreground">
            This ensures that only authorized administrators can view and manage user data, protecting the privacy of your users.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
