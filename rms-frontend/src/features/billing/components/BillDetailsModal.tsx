import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Bill } from "../types";

interface BillDetailsModalProps {
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatCurrency(value: string) {
  return `Rs. ${Number(value).toLocaleString()}`;
}



function statusVariant(
  status: string,
): "default" | "destructive" | "secondary" {
  switch (status) {
    case "PAID":
      return "default";
    case "DUE":
    case "PARTIALLY_PAID":
      return "destructive";
    default:
      return "secondary";
  }
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function BillDetailsModal({
  bill,
  open,
  onOpenChange,
}: BillDetailsModalProps) {
  if (!bill) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-zinc-900">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>{bill.billNumber}</DialogTitle>
            <Badge variant={statusVariant(bill.status)}>{bill.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Order
            </h4>
            <Row label="Order Number" value={bill.order.orderNumber} />
            <Row label="Channel" value={bill.order.channel.replace("_", " ")} />
            <Row label="Order Status" value={bill.order.channel} />
            {bill.order.table && (
              <Row label="Table" value={bill.order.table.name} />
            )}
          </div>

          <Separator />

          <div>
            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
              Payment
            </h4>
            <Row label="Subtotal" value={formatCurrency(bill.subtotal)} />
            <Row label="Discount" value={formatCurrency(bill.discount)} />
            <Row label="Grand Total" value={formatCurrency(bill.grandTotal)} />
            <Row label="Paid" value={formatCurrency(bill.paid)} />
            <Row label="Refunded" value={formatCurrency(bill.refunded)} />
            <Row label="Due" value={formatCurrency(bill.due)} />
          </div>

          <Separator />
        </div>
      </DialogContent>
    </Dialog>
  );
}
