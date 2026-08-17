export interface KitchenStation {
  id: string;
  name: string;
  printerId: string | null; // nullable — "Main Kitchen" has null, others have a string
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
    assignedStaff?: AssignedStaff[];
}

export interface KitchenStationListParams {
  page?: number;
  limit?: number;
  isActive?:boolean,
  search?:string,
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface KitchenStationListResponse {
  success: boolean;
  data: KitchenStation[];
  meta: PaginationMeta;
}
export interface CreateKitchenStationPayload{
    name:string,
    printerId?:string,
     isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
   assignedStaffIds?: string[];

}
export interface KitchenStationResponse {
  success: boolean;
  data: KitchenStation; 
}

export interface  StationSummary{
  id:string,
  name:string
}

export interface MenuItemRouting {
  menuItemId: string;
  name: string;
  station: StationSummary;
}

export interface KitchenStationRoutingData {
  defaultStation: StationSummary;
  items: MenuItemRouting[];
}

export interface KitchenStationRoutingResponse {
  success: boolean;
  data: KitchenStationRoutingData;
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuSubcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface MenuItemSummary {
  id: string;
  name: string;
}

export interface KitchenStationAssignmentOptions {
  categories: MenuCategory[];
  subcategories: MenuSubcategory[];
  menuItems: MenuItemSummary[];
}

export interface KitchenStationAssignmentOptionsResponse {
  success: boolean;
  data: KitchenStationAssignmentOptions;
}

export interface DeleteStationResponse {
  id: string;
  deleted: boolean;
}


export interface DeleteStationApiResponse {
  success: boolean;
  data: DeleteStationResponse;
}
export interface AssignedStaff {
  id: string;
  name: string;
  email: string;
  role: string; // or a union like "KITCHEN" | "WAITER" | "ADMIN" if you have fixed roles
}
export interface Staff {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}
export interface UpdateKitchenStationPayload {
  name: string;
  printerId?: string;
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
  staffIds?: string[];
}