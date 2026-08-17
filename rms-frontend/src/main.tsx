import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConfirmProvider } from "@/providers/ConfirmProvider";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { SocketProvider } from "./providers/SocketProvider";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <SocketProvider>
          <App />
        </SocketProvider>
      </ConfirmProvider>
    </QueryClientProvider>
  </Provider>,
);
