import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.tsx';
import { RoleCard, SettingsSection } from './components';
import type { RolesTabProps } from './types.ts';

export const RolesTab = ({
  draft,
  users,
  expandedRoleId,
  setExpandedRoleId,
  addRole,
  deleteRole,
  updateRole,
}: RolesTabProps) => (
  <SettingsSection
    title="Project Roles"
    action={
      <Button size="sm" onClick={addRole}>
        <Plus data-icon="inline-start" />
        Add role
      </Button>
    }
  >
    {draft.roles.map((role) => {
      const isOpen = expandedRoleId === role.id;

      return (
        <RoleCard
          key={role.id}
          role={role}
          isOpen={isOpen}
          users={users}
          onToggle={() => setExpandedRoleId(isOpen ? null : role.id)}
          updateRole={updateRole}
          deleteRole={deleteRole}
        />
      );
    })}
  </SettingsSection>
);
