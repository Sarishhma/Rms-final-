import type{ AuditLog } from "@/features/audit/type/index";
import { timeAgo } from "@/utils/format";

function getActionLabel(action: string) {
  switch (action) {
    case "TABLE_RELEASED":
      return "Table Released";
    case "PAYMENT_CREATED":
      return "Payment Completed";
    case "STOCK_ADJUSTED":
      return "Stock Adjusted";
    default:
      return action;
  }
}

function getIcon(action: string) {
  switch (action) {
    case "TABLE_RELEASED":
      return "🪑";
    case "PAYMENT_CREATED":
      return "💰";
    case "STOCK_ADJUSTED":
      return "📦";
    default:
      return "📌";
  }
}

export default function ActivityCard({ log }: { log: AuditLog }) {
  return (
    <div className="bg-white border rounded-xl p-4 space-y-2 hover:shadow-sm transition">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{getIcon(log.action)}</span>
          <p className="font-medium text-slate-800">
            {getActionLabel(log.action)}
          </p>
        </div>

        <span className="text-xs text-slate-400">
          {timeAgo(log.createdAt)}
        </span>
      </div>

      <p className="text-sm text-slate-600">
        By <span className="font-medium">{log.actor.name}</span> ({log.actor.role})
      </p>

      <div className="text-xs text-slate-500">
        Entity: {log.entity}
      </div>

      {log.action === "TABLE_RELEASED" && log.before && log.after && (
        <p className="text-xs text-slate-500">
          Table: {log.before.name} → {log.after.status}
        </p>
      )}

      {log.action === "PAYMENT_CREATED" && log.after && (
        <p className="text-xs text-slate-500">
          Amount: {log.after.amount}
        </p>
      )}
    </div>
  );
}