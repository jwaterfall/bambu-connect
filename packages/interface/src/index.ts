export interface Filament {
  material: string;
  color: string;
  temperature: {
    min: number;
    max: number;
  };
}

export enum PrinterStatus {
  Idle = "IDLE",
  Preparing = "PREPARING",
  Printing = "PRINTING",
  Paused = "PAUSED",
  Finished = "FINISHED",
  Failed = "FAILED",
}

export interface TemperatureReading {
  timestamp: number;
  current: number;
  target: number;
}

export interface Printer {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  state: {
    status: PrinterStatus;
    current_print: {
      file_name: string;
      preparation_percentage: number | null;
      print_percentage: number | null;
      remaining_time_seconds: number | null;
      currentLayer: number;
      totalLayers: number;
    } | null;
    hotend: {
      temperature: {
        current: number;
        target: number;
        history: TemperatureReading[];
      };
      nozzle: {
        diameter_mm: number;
        material: string;
      };
    };
    bed: {
      temperature: {
        current: number;
        target: number;
        history: TemperatureReading[];
      };
    };
    lights: {
      chamber: boolean;
    };
    filament: Filament; // Currently loaded filament
    ams: {
      slot1: Filament | null; // Predefined slot for AMS filament 1
      slot2: Filament | null; // Predefined slot for AMS filament 2
      slot3: Filament | null; // Predefined slot for AMS filament 3
      slot4: Filament | null; // Predefined slot for AMS filament 4
    };
    sd_card: {
      inserted: boolean;
    };
    camera: {
      recording: boolean;
      timelapse: boolean;
      resolution: "1080p";
    };
  };
}

interface BaseCommand {
  printerId: string;
}

interface StandardCommand extends BaseCommand {
  type: "pause" | "resume" | "stop" | "home";
}

interface LedControlCommand extends BaseCommand {
  type: "chamber_light";
  state: boolean;
}

interface TemperatureCommand extends BaseCommand {
  type: "hotend_temperature" | "bed_temperature";
  target: number;
}

export type Command = StandardCommand | LedControlCommand | TemperatureCommand;
