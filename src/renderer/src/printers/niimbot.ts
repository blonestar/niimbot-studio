import { ImageEncoder, LabelType, NiimbotBluetoothClient, PageColorType, type PrintTaskName } from "@mmote/niimbluelib";
import { AppError } from "../i18n";
import type { DriverEvents, PrinterDriver } from "./types";

const hex = (d: Uint8Array) => [...d].map((b) => b.toString(16).padStart(2, "0")).join(" ");

/** NIIMBOT printers over Bluetooth LE, using niimbluelib for the protocol. */
export function createNiimbotDriver(events: DriverEvents): PrinterDriver {
  const client = new NiimbotBluetoothClient();
  let task: PrintTaskName | undefined;

  if (import.meta.env.DEV) {
    client.setDebug(true);
    client.on("rawpacketsent", (e) => console.debug(">>", hex(e.data)));
    client.on("rawpacketreceived", (e) => console.debug("<<", hex(e.data)));
  }
  client.on("disconnect", () => events.onDisconnect());
  client.on("heartbeat", (e) => {
    if (e.data.batteryPercents !== undefined) events.onBattery(e.data.batteryPercents);
  });
  client.on("printprogress", (e) => {
    events.onProgress(Math.max(0, Math.min(1, (e.page - 1 + e.pagePrintProgress / 100) / e.pagesTotal)));
  });

  return {
    async connect() {
      try {
        const info = await client.connect();
        const meta = client.getModelMetadata();
        task = client.getPrintTaskType();
        if (!meta || !task) throw new AppError("error.unknownModel");
        client.startHeartbeat();
        return { name: info.deviceName ?? meta.model, model: meta.model, battery: client.getPrinterInfo().batteryPercents };
      } catch (err) {
        await client.disconnect().catch(() => {});
        throw err;
      }
    },

    disconnect: () => client.disconnect(),

    async print({ canvas, copies, density, profile }) {
      if (!task) throw new AppError("error.notConnected");
      const encoded = ImageEncoder.encodeCanvas(canvas, PageColorType.SingleColor, profile.printDirection);
      const job = client.protocol.newPrintTask(task, { totalPages: copies, density, labelType: LabelType.WithGaps });
      try {
        await job.printInit();
        await job.printPage(encoded, copies);
        await job.waitForFinished();
      } finally {
        await client.protocol.printEnd().catch(() => false);
      }
    },
  };
}
