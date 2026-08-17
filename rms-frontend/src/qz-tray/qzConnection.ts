import qz from "qz-tray";

class QZConnection {
  constructor() {
   
    qz.security.setSignaturePromise(() => {
      return (resolve: (signature: string) => void) => {
        resolve("dummy-signature");
      };
    });
  }

  /**
   * Connect to QZ Tray if not already connected.
   */
  async connect(): Promise<void> {
    try {
      const active = await qz.websocket.isActive();

      if (active) {
        return;
      }

      await qz.websocket.connect({
        retries: 5,
        delay: 1,
      });

      console.log("✅ Connected to QZ Tray");
    } catch (error) {
      console.error("❌ Failed to connect to QZ Tray", error);
      throw error;
    }
  }

  /**
   * Disconnect from QZ Tray.
   */
  async disconnect(): Promise<void> {
    try {
      const active = await qz.websocket.isActive();

      if (!active) {
        return;
      }

      await qz.websocket.disconnect();

      console.log("🔌 Disconnected from QZ Tray");
    } catch (error) {
      console.error("❌ Failed to disconnect", error);
    }
  }

  /**
   * Ensure an active connection exists.
   */
  async ensureConnection(): Promise<void> {
    if (!(await qz.websocket.isActive())) {
      await this.connect();
    }
  }

  /**
   * Returns current connection state.
   */
  async isConnected(): Promise<boolean> {
    return qz.websocket.isActive();
  }

  /**
   * Returns the QZ instance.
   */
  getQZ() {
    return qz;
  }
}

/**
 * Singleton instance
 */
export const qzConnection = new QZConnection();