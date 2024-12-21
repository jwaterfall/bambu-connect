"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  PropsWithChildren,
} from "react";
import { io, Socket } from "socket.io-client";
import { Command, Printer } from "@repo/interface";

interface ConnectorContext {
  connected: boolean;
  printers: Printer[];
  selectedPrinter: Printer | null;
  setSelectedPrinterId: (printerId: string) => void;
  pause: (printerId: string) => void;
  resume: (printerId: string) => void;
  stop: (printerId: string) => void;
  setChamberLight(printerId: string, state: boolean): void;
  setHotendTemperature(printerId: string, temperature: number): void;
  setBedTemperature(printerId: string, temperature: number): void;
  home(printerId: string): void;
}

const ConnectorContext = createContext<ConnectorContext>(
  {} as ConnectorContext
);

export const useConnector = () => useContext(ConnectorContext);

export const ConnectorProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinterId, setSelectedPrinterId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!selectedPrinterId && printers[0]) {
      setSelectedPrinterId(printers[0].id);
    }
  }, [printers]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_NODE_URL!);
    setSocket(socket);

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("printers", (printers: Printer[]) => {
      setPrinters(printers);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function sendCommand(command: Command) {
    socket?.emit("command", command);
  }

  function pause(printerId: string) {
    sendCommand({ type: "pause", printerId });
  }

  function resume(printerId: string) {
    sendCommand({ type: "resume", printerId });
  }

  function stop(printerId: string) {
    sendCommand({ type: "stop", printerId });
  }

  function setChamberLight(printerId: string, state: boolean) {
    sendCommand({ type: "chamber_light", printerId, state });
  }

  function setHotendTemperature(printerId: string, temperature: number) {
    sendCommand({ type: "hotend_temperature", printerId, target: temperature });
  }

  function setBedTemperature(printerId: string, temperature: number) {
    sendCommand({ type: "bed_temperature", printerId, target: temperature });
  }

  function home(printerId: string) {
    sendCommand({ type: "home", printerId });
  }

  return (
    <ConnectorContext.Provider
      value={{
        connected,
        printers,
        selectedPrinter:
          printers.find((printer) => printer.id === selectedPrinterId) || null,
        setSelectedPrinterId,
        pause,
        resume,
        stop,
        setChamberLight,
        setHotendTemperature,
        setBedTemperature,
        home,
      }}
    >
      {children}
    </ConnectorContext.Provider>
  );
};
