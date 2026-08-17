export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="flex gap-2">
        <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
        <span className="w-3 h-3 bg-yellow-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <span className="w-3 h-3 bg-red-500 rounded-full animate-bounce" />
      </div>
    </div>
  );
}