export interface ModuleItem {
  id: string;
  title: string;
  category: string;
  duration_minutes: number | null;
}

export interface BlockPlanItem {
  tempId: string;
  module: ModuleItem;
  coach_note: string;
  custom_duration: number;
}

export interface PlanItem {
  id: string;
  block_id?: string;
  module_id?: string;
  title: string;
  category: string;
  sport: string;
  duration_minutes: number;
  difficulty: string;
  coach_note: string;
  order_index: number;
  is_completed?: boolean;
  exercises?: any[];
}

export interface DayPlan {
  id?: string;
  plan_date: string;
  player_id: string;
  coach_id: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  items: PlanItem[];
}
