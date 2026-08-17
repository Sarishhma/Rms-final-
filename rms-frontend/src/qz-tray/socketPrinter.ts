import { qzConnection } from "./qzConnection";
import { KotBuilder } from "./kotBuilder";
import type { KitchenRoute } from "./printer.types";

export interface PrintResult {
  kitchenStationName: string;
  printerIp: string | null;
  printerPort: number | null;
  success: boolean;
  error?: string;
  timestamp: string;
}

export class SocketPrinter {
  static async print(
    route: KitchenRoute,
    ensureConnection = true,
  ): Promise<void> {
    if (ensureConnection) {
      await qzConnection.ensureConnection();
    }

    const qz = qzConnection.getQZ();
    const config = qz.configs.create({
      host: route.printerIp,
      port: route.printerPort,
    });

    const payload = KotBuilder.build(route);
    await qz.print(config, payload);
  }

  /**
   * Prints to every station, continues even if one fails,
   * and returns a per-station result log.
   */
  static async printMultiple(routes: KitchenRoute[]): Promise<PrintResult[]> {
    await qzConnection.ensureConnection();

    const results: PrintResult[] = [];

    for (const route of routes) {
      const timestamp = new Date().toISOString();
      try {
        await this.print(route, false);
        console.log(
          `✅ [${timestamp}] Printed ${route.kitchenStationName} -> ${route.printerIp}:${route.printerPort}`,
        );
        results.push({
          kitchenStationName: route.kitchenStationName,
          printerIp: route.printerIp,
          printerPort: route.printerPort,
          success: true,
          timestamp,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `❌ [${timestamp}] Failed ${route.kitchenStationName} -> ${route.printerIp}:${route.printerPort}`,
          error,
        );
        results.push({
          kitchenStationName: route.kitchenStationName,
          printerIp: route.printerIp,
          printerPort: route.printerPort,
          success: false,
          error: message,
          timestamp,
        });
      }
    }

    return results;
  }
}
