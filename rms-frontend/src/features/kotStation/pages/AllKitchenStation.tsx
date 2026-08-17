import { CreateKitchenStationModal } from "../components/CreateStationModal";

import { ChefHat } from "lucide-react";
import { KitchenStationsList } from "../components/KitchenStationsList";

export default function AllKitchenStation() {
  return (
    <div className="mx-auto w-full h-screen space-y-6 p-6 bg-white ">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20">
            <ChefHat className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Kitchen Stations
            </h1>
            <p className="text-sm text-gray-500">
              Manage your kitchen stations and routing
            </p>
          </div>
        </div>
        <CreateKitchenStationModal />
      </div>

      {/* Content */}
      <KitchenStationsList />
    </div>
  );
}