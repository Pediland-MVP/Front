// src/types/label.ts

// A label assignment as returned on user/customer rows (user_labels join row
// with the nested label detail). Backend shape: attachLabels() in
// Back/apps/admin/src/users/users.service.ts
export interface AssignedLabel {
  labelId: string;
  assignedAt?: string;
  label: {
    id: string;
    name: string;
    color?: string | null;
  };
}
