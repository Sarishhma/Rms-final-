import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./SocketProvider";
import { useEffect } from "react";
import { socketQueryMap, websocketEvents } from "@/lib/socket";

// Helper function to turn socket events into user-friendly message text with details
const getEventMessage = (event: string, data?: any): string => {
  switch (event) {
    case websocketEvents.orderUpdated:
      if (data?.orderNumber) {
        return `Order #${data.orderNumber} updated (Status: ${data.status}).`;
      }
      return "Order details updated.";
    case websocketEvents.kotUpdated:
      if (data?.kotNumber) {
        return `KOT #${data.kotNumber} was updated.`;
      }
      if (data?.order?.orderNumber) {
        return `KOT for Order #${data.order.orderNumber} was updated.`;
      }
      return "A kitchen order ticket (KOT) was updated.";
    case websocketEvents.tableUpdated:
      if (data?.name) {
        return `Table ${data.name} status changed to ${data.status}.`;
      }
      if (data?.status) {
        return `Table status changed to ${data.status}.`;
      }
      return "Table assignment status changed.";
    case websocketEvents.billUpdated:
      if (data?.billNumber) {
        return `Bill #${data.billNumber} details have been modified.`;
      }
      return "Billing details have been modified.";
    case websocketEvents.paymentUpdated:
      if (data?.orderNumber) {
        return `Payment processed successfully for Order #${data.orderNumber}.`;
      }
      return "Payment processed successfully.";
    case websocketEvents.stockUpdated:
      if (data?.name) {
        return `Stock levels for ${data.name} were updated.`;
      }
      return "Stock levels were updated.";
    default:
      return "System update received.";
  }
};

// Helper function to get the type (for bell category styling/icons)
const getEventType = (event: string): string => {
  if (event.includes("order")) return "order";
  if (event.includes("kot")) return "kot";
  if (event.includes("table")) return "table";
  if (event.includes("bill")) return "bill";
  if (event.includes("payment")) return "payment";
  if (event.includes("stock")) return "stock";
  return "system";
};

export const useSocketSync = () => {
  const queryClient = useQueryClient();
  const { socket, isConnected, addNotification } = useSocket();

  useEffect(() => {
    if (!isConnected) return;

    // 1. Accept data payload from the event
    const handleEvent = (event: websocketEvents, data?: any) => {
      const queryKeysToInvalidate = socketQueryMap[event];
      if (queryKeysToInvalidate) {

        // Refresh react-query caches
        queryKeysToInvalidate.forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey });
        });

        // 2. Generate detailed message and save to history (under the bell)
        const message = getEventMessage(event, data);
        const type = getEventType(event);
        addNotification(message, type);
      }
    };

    // 3. Pass the event payload parameter (data) to handleEvent
    const activeEvents = Object.values(websocketEvents);
    activeEvents.forEach((event) => {
      socket.on(event, (data: any) => handleEvent(event, data));
    });

    return () => {
      activeEvents.forEach((event) => {
        socket.off(event);
      });
    };
  }, [socket, isConnected, queryClient, addNotification]);
};
