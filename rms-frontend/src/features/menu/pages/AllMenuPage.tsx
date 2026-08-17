import { useState, useRef } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useCategories } from "@/features/menu/hooks/useCategories";
import { useMenuItems } from "@/features/menu/hooks/useMenuItems";
import { useDeleteMenuItem } from "@/features/menu/hooks/useDeleteMenuItem";
import Loader from "@/features/shared/LottieLoader";
import MenuForm from "@/features/menu/components/MenuForm";
import { useConfirm } from "@/providers/ConfirmProvider";

export default function AllItemsPage() {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  const tabRef = useRef<HTMLDivElement | null>(null);

  const scrollTabs = (direction: "left" | "right") => {
    if (!tabRef.current) return;
    tabRef.current.scrollBy({
      left: direction === "left" ? -200 : 200,
      behavior: "smooth",
    });
  };

  const { data: categories = [] } = useCategories();

  const { data, isLoading } = useMenuItems({
    page,
    limit: 20,
    categoryId: activeTab === "all" ? undefined : activeTab,
    search: search || undefined,
  });


  const { menuItems = [], meta } = data ?? {};

  const deleteMenu = useDeleteMenuItem();
  const confirm = useConfirm();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // reset page on new search
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setPage(1); // reset page on tab change
  };

  const openAdd = () => {
    setSelectedItem(null);
    setOpenModal(true);
  };

  const openEdit = (item: any) => {
    setSelectedItem(item);
    setOpenModal(true);
  };

  const closeModal = () => {
    setOpenModal(false);
    setSelectedItem(null);
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: "Delete Menu Item?",
      description: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete",
      type: "danger",
    });
    if (!ok) return;
    deleteMenu.mutate(id);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              All Menu Items
            </h1>
            <p className="text-slate-500 mt-1">
              Manage restaurant food and beverage items.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl text-sm font-semibold transition"
          >
            <Plus size={18} />
            Add New Item
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1 lg:max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search by name or SKU..."
                value={search}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => scrollTabs("left")}
            className="p-2 rounded-xl bg-white border"
          >
            <ChevronLeft size={18} />
          </button>

          <div
            ref={tabRef}
            className="flex gap-2 overflow-x-auto scroll-smooth scrollbar-hide"
          >
            <button
              onClick={() => handleTabChange("all")}
              className={`px-3 py-1.5 whitespace-nowrap shrink-0 rounded-xl text-sm ${
                activeTab === "all"
                  ? "bg-orange-600 text-white"
                  : "bg-white border"
              }`}
            >
              All
            </button>

            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`px-3 py-1.5 whitespace-nowrap shrink-0 rounded-xl text-sm ${
                  activeTab === cat.id
                    ? "bg-orange-600 text-white"
                    : "bg-white border"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollTabs("right")}
            className="p-2 rounded-xl bg-white border"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* LOADER */}
        {isLoading && <Loader />}

        {/* CARDS — use menuItems directly, no client-side filtering */}
        {!isLoading && (
          <>
            {menuItems.length === 0 ? (
              <p className="text-center text-slate-400 py-16">
                No items found.
              </p>
            ) : (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {menuItems.map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-white border rounded-2xl shadow-sm flex flex-col"
                  >
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-xs text-slate-400">
                        {item.description}
                      </p>
                    </div>
                    <div className="p-4 flex-1 text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Price</span>
                        <span>NPR {item.basePrice}</span>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 p-3 border-t">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-2 bg-blue-50 text-blue-700 rounded-lg"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PAGINATION */}
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="bg-blue-200 text-blue-800 rounded px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-600">
                  Page {meta.page} / {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                  className="bg-green-200 text-green-900 rounded px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeModal}
            />
            <div className="relative bg-white w-full max-w-3xl rounded-2xl p-6">
              <MenuForm initialData={selectedItem} onClose={closeModal} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
