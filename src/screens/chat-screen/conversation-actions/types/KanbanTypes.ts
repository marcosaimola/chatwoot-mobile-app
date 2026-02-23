export interface KanbanContact {
  id: number;
  name: string;
  email: string;
  phone_number: string;
}

export interface KanbanItem {
  id: string;
  funnel_name: string;
  stage_name: string;
  funnel_id: string;
  stage_id: string;
  description: string;
  value: number | null;
  priority: 'low' | 'medium' | 'high' | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  position: string;
  conversation_id: number;
  agent: any;
  contact: KanbanContact;
  title: string;
  cod_ref_item: string | null;
  account_id: string;
  funnel_item_products?: FunnelItemProduct[];
}

export interface Product {
  id: string;
  account_id: number;
  name: string;
  description: string;
  fixed_price: string;
  allow_price_override: boolean;
  active: boolean;
  image_url: string;
  created_at: string;
}

export interface FunnelItemProduct {
  funnel_item_id?: string;
  product_id: string;
  quantity: number;
  unit_value: number;
}

export interface ProductRow {
  productId: string;
  quantity: number;
  unitValue: number;
}

export interface KanbanStage {
  stage_id: string;
  stage_name: string;
}

export interface KanbanFunnel {
  funnel_id: string;
  funnel_name: string;
  stages: KanbanStage[];
}

export interface KanbanItemFormData {
  funnel_id: string;
  stage_id: string;
  title: string;
  description: string;
  value: number;
  priority: 'low' | 'medium' | 'high';
  conversation_id: number;
  contact: {
    id: number;
    phone_number: string;
  };
}
