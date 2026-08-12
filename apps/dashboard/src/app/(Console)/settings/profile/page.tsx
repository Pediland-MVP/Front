'use client';

import { useTranslations } from 'next-intl';

import { LayoutSettings } from '@/components/Layout/LayoutSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileForm } from '@/components/Settings/ProfileForm';
import { PasswordTab } from '@/components/Settings/PasswordTab';
import { AccountSessionsTab } from '@/components/Settings/AccountSessions/AccountSessionsTab';

export default function Page() {
  const t = useTranslations('Settings.Profile');

  return (
    <LayoutSettings className="_profile-page">
      <div className="mb-5 space-y-1">
        <h2 className="text-primary font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground text-sm">{t('description')}</p>
      </div>

      <Tabs defaultValue="profile" className="flex-1">
        <TabsList>
          <TabsTrigger value="profile">{t('tab_profile')}</TabsTrigger>
          <TabsTrigger value="password">{t('tab_password')}</TabsTrigger>
          <TabsTrigger value="sessions">{t('tab_sessions')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="password">
          <PasswordTab />
        </TabsContent>
        <TabsContent value="sessions">
          <AccountSessionsTab />
        </TabsContent>
      </Tabs>
    </LayoutSettings>
  );
}
