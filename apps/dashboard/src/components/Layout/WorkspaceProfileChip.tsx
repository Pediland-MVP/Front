'use client';

import { ChevronDownIcon } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { getAvatarColor } from '@/utils/avatarColor';
import { WorkspaceDrawer } from '../Console/WorkspaceDrawer';
import type { Workspace } from '@/types/workspace';

const AVATAR_SIZE = 'h-8 w-8 border-2 border-white';
const MAX_VISIBLE_AVATARS = 2;

const WorkspaceAvatarStack = ({ workspace }: { workspace: Workspace }) => {
  const instagrams = workspace.instagrams;

  if (instagrams.length === 0) {
    return (
      <Avatar className={AVATAR_SIZE}>
        <AvatarFallback
          className={cn('text-xs font-semibold text-white', getAvatarColor(workspace.id))}
        >
          {workspace.name.charAt(0)}
        </AvatarFallback>
      </Avatar>
    );
  }

  if (instagrams.length === 1) {
    const account = instagrams[0];
    return (
      <Avatar className={AVATAR_SIZE}>
        <AvatarImage src={account.profilePicture?.url} alt={account.username} />
        <AvatarFallback
          className={cn('text-xs font-semibold text-white', getAvatarColor(workspace.id))}
        >
          {account.username.charAt(0)}
        </AvatarFallback>
      </Avatar>
    );
  }

  const visible = instagrams.slice(0, MAX_VISIBLE_AVATARS);
  const remaining = instagrams.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((account, index) => (
        <Avatar key={account.id} className={cn(AVATAR_SIZE, index > 0 && '-ms-2')}>
          <AvatarImage src={account.profilePicture?.url} alt={account.username} />
          <AvatarFallback
            className={cn('text-xs font-semibold text-white', getAvatarColor(account.id))}
          >
            {account.username.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ))}
      {remaining > 0 && (
        <Avatar className={cn(AVATAR_SIZE, '-ms-2')}>
          <AvatarFallback className="bg-primary text-[10px] font-semibold text-white">
            +{remaining}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

const WorkspaceProfileChipSkeleton = () => (
  <div className="flex w-full items-center gap-2.5 rounded-md border border-dashed border-violet-300/70 bg-violet-100 px-2 py-2">
    <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-violet-200" />
    <div className="h-3 flex-1 animate-pulse rounded-full bg-violet-200" />
  </div>
);

export const WorkspaceProfileChip = () => {
  const { workspaceId } = usePermissions();
  const { workspaces, isLoading } = useWorkspaces();
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);

  if (isLoading || !currentWorkspace) {
    return <WorkspaceProfileChipSkeleton />;
  }

  return (
    <WorkspaceDrawer>
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-violet-300/70 bg-violet-100 px-2 py-2 text-right transition-colors outline-none hover:bg-violet-100/70 active:bg-violet-100"
      >
        <WorkspaceAvatarStack workspace={currentWorkspace} />

        <p className="text-foreground min-w-0 flex-1 truncate text-start text-sm font-bold">
          {currentWorkspace.name}
        </p>

        <ChevronDownIcon size={16} className="text-secondary shrink-0" />
      </button>
    </WorkspaceDrawer>
  );
};
