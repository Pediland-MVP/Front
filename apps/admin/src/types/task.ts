export type TaskLabel = { id: string; name: string; color: string };

export type TaskListItem = {
  id: string;
  actionDate: string;
  doneDate: string | null;
  status: "todo" | "done";
  type: "phone" | "telegram" | "instagram" | "whatsapp";
  description: string | null;
  admin: { id: string; firstname: string; lastname: string };
  user: { id: string; firstname: string; lastname: string; mobile: string | null };
  instagramUsername: string | null;
  labels: TaskLabel[];
};

export type TasksStats = {
  today: number;
  expired: number;
  doneToday: number;
  thisWeek: number;
};
