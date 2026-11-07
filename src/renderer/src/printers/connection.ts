import { create } from "zustand";
import { AppError, t } from "../i18n";
import { createNiimbotDriver } from "./niimbot";
import { profileForModel } from "./profiles";
import { useSettings } from "./settings";
import type { ConnectedPrinter, DriverEvents, DriverId, PrinterDriver } from "./types";

export type PrintJob = { copies: number; progress: number };

export type ConnectionState =
  | { status: "disconnected"; error?: unknown }
  | { status: "connecting" }
  | { status: "connected"; printer: ConnectedPrinter; job?: PrintJob };

export const useConnection = create<ConnectionState>(() => ({ status: "disconnected" }));

function patchConnected(
  fn: (s: Extract<ConnectionState, { status: "connected" }>) => Partial<Extract<ConnectionState, { status: "connected" }>>,
) {
  const s = useConnection.getState();
  if (s.status === "connected") useConnection.setState({ ...s, ...fn(s) }, true);
}

const events: DriverEvents = {
  onDisconnect: () => useConnection.setState({ status: "disconnected" }, true),
  onBattery: (battery) => patchConnected((s) => ({ printer: { ...s.printer, battery } })),
  onProgress: (progress) => patchConnected((s) => (s.job ? { job: { ...s.job, progress } } : {})),
};

const drivers: Record<DriverId, PrinterDriver> = {
  niimbot: createNiimbotDriver(events),
};

const activeDriver = () => drivers[useSettings.getState().profile.driver];

export async function connectPrinter(): Promise<void> {
  useConnection.setState({ status: "connecting" }, true);
  try {
    const printer = await activeDriver().connect();
    const detected = profileForModel(printer.model);
    if (detected && detected.id !== useSettings.getState().profile.id) useSettings.getState().setProfile(detected.id);
    useConnection.setState({ status: "connected", printer }, true);
  } catch (err) {
    useConnection.setState({ status: "disconnected", error: err }, true);
  }
}

export async function disconnectPrinter(): Promise<void> {
  await activeDriver().disconnect();
  useConnection.setState({ status: "disconnected" }, true);
}

export async function printCanvas(canvas: HTMLCanvasElement, copies: number, density: number): Promise<void> {
  if (useConnection.getState().status !== "connected") throw new AppError("error.notConnected");
  patchConnected(() => ({ job: { copies, progress: 0 } }));
  try {
    await activeDriver().print({ canvas, copies, density, profile: useSettings.getState().profile });
  } finally {
    patchConnected(() => ({ job: undefined }));
  }
}

export function describeError(err: unknown): string {
  if (err instanceof AppError) return t(err.key);
  if (err instanceof DOMException && err.name === "NotFoundError") return t("error.pickCancelled");
  return err instanceof Error ? err.message : String(err);
}
