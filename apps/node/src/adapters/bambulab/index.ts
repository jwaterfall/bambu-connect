import { randomUUID } from "crypto";
import mqtt from "mqtt";
import { Logger } from "winston";
import { merge } from "lodash";
import {
  Command,
  Printer,
  PrinterStatus,
  TemperatureReading,
} from "@repo/interface";
import { BambulabState, BambulabModel } from "./bambulab.interface";

export * from "./bambulab.interface";

export interface BambulabConfig {
  host: string;
  token: string;
  serial: string;
  name: string;
  model: BambulabModel;
}

export class Bambulab {
  public readonly id = randomUUID();
  protected client: mqtt.MqttClient;
  protected rawState: BambulabState | undefined;
  protected hotendTemperatureHistory: TemperatureReading[] = [];
  protected bedTemperatureHistory: TemperatureReading[] = [];

  constructor(
    protected config: BambulabConfig,
    protected onStateChange: () => void,
    protected logger: Logger
  ) {
    const { host, token } = config;

    this.client = mqtt.connect(`mqtts://${host}:8883`, {
      username: "bblp",
      password: token,
      reconnectPeriod: 30,
      rejectUnauthorized: false,
    });

    this.client.on("connect", this.onConnect.bind(this));
    this.client.on("message", this.onMessage.bind(this));
  }

  protected onConnect() {
    this.logger.info("Connected to printer MQTT broker");

    this.client.subscribe(`device/${this.config.serial}/report`, () => {
      this.logger.info("Subscribed to printer report topic");
    });

    // Request the printer to push all state on first connection
    this.publishMtqqMessage({
      pushing: {
        sequence_id: "1",
        command: "pushall",
      },
      user_id: "1234567890",
    });

    setInterval(this.recordTemperature.bind(this), 15000);
  }

  protected onMessage(topic: string, message: Buffer) {
    const payload = JSON.parse(message.toString());

    this.logger.debug("Received message", { topic, payload });

    switch (topic) {
      case `device/${this.config.serial}/report`:
        this.rawState = merge(this.rawState, payload.print);
        this.onStateChange();
        break;
    }
  }

  protected publishMtqqMessage(message: object) {
    const topic = `device/${this.config.serial}/request`;
    const payload = JSON.stringify(message);

    this.client.publish(topic, payload, (err) => {
      if (err) {
        this.logger.error("Failed to publish message", err);
      } else {
        this.logger.debug("Published message", { topic, payload });
      }
    });
  }

  protected getGcodeMessage(command: string) {
    return {
      print: {
        sequence_id: "0",
        command: "gcode_line",
        param: `${command} \n`,
      },
    };
  }

  protected getAMSFilament(slot: number) {
    if (!this.rawState) {
      this.logger.warn("Printer state is not available, skipping");
      return null;
    }

    const tray = this.rawState.ams.ams[0]?.tray.find(
      (tray) => tray.id === (slot - 1).toString()
    );

    if (!tray || !tray.tray_type) {
      return null;
    }

    return {
      material: tray.tray_type!,
      color: `#${tray.tray_color!}`,
      temperature: {
        min: parseFloat(tray.nozzle_temp_min!),
        max: parseFloat(tray.nozzle_temp_max!),
      },
    };
  }

  protected getStatus(status: string): PrinterStatus {
    switch (status) {
      case "PREPARE":
        return PrinterStatus.Preparing;
      case "RUNNING":
        return PrinterStatus.Printing;
      case "PAUSED":
        return PrinterStatus.Paused;
      case "FINISHED":
        return PrinterStatus.Finished;
      case "FAILED":
        return PrinterStatus.Failed;
      default:
        return PrinterStatus.Idle;
    }
  }

  protected recordTemperature() {
    if (this.rawState) {
      const timestamp = Date.now();
      this.hotendTemperatureHistory.push({
        timestamp,
        current: this.rawState.nozzle_temper,
        target: this.rawState.nozzle_target_temper,
      });
      this.bedTemperatureHistory.push({
        timestamp,
        current: this.rawState.bed_temper,
        target: this.rawState.bed_target_temper,
      });
    }
  }

  public getPrinter(): Printer | null {
    if (!this.rawState) {
      this.logger.warn("Printer state is not available, skipping");
      return null;
    }

    return {
      id: this.id,
      name: this.config.name,
      manufacturer: "bambulab",
      model: this.config.model,
      state: {
        status: this.getStatus(this.rawState.gcode_state),
        current_print:
          this.rawState.gcode_state === "RUNNING" ||
          this.rawState.gcode_state === "PREPARE"
            ? {
                file_name: this.rawState.gcode_file,
                preparation_percentage:
                  this.rawState.gcode_file_prepare_percent !== "0"
                    ? parseFloat(this.rawState.gcode_file_prepare_percent)
                    : null,
                print_percentage: this.rawState.mc_percent,
                remaining_time_seconds: this.rawState.mc_remaining_time * 60,
                currentLayer: this.rawState.layer_num,
                totalLayers: this.rawState.total_layer_num,
              }
            : null,
        hotend: {
          temperature: {
            current: this.rawState.nozzle_temper,
            target: this.rawState.nozzle_target_temper,
            history: this.hotendTemperatureHistory,
          },
          nozzle: {
            diameter_mm: parseFloat(this.rawState.nozzle_diameter),
            material: this.rawState.nozzle_type,
          },
        },
        bed: {
          temperature: {
            current: this.rawState.bed_temper,
            target: this.rawState.bed_target_temper,
            history: this.bedTemperatureHistory,
          },
        },
        lights: {
          chamber:
            this.rawState.lights_report.find(
              (light) => light.node === "chamber_light"
            )?.mode === "on",
        },
        filament: {
          material: this.rawState.vt_tray.tray_type,
          color: `#${this.rawState.vt_tray.tray_color}`,
          temperature: {
            min: parseFloat(this.rawState.vt_tray.nozzle_temp_min),
            max: parseFloat(this.rawState.vt_tray.nozzle_temp_max),
          },
        },
        ams: {
          slot1: this.getAMSFilament(1),
          slot2: this.getAMSFilament(2),
          slot3: this.getAMSFilament(3),
          slot4: this.getAMSFilament(4),
        },
        sd_card: {
          inserted: this.rawState.sdcard,
        },
        camera: {
          recording: this.rawState.ipcam.ipcam_record === "enable",
          timelapse: this.rawState.ipcam.timelapse === "enable",
          resolution: this.rawState.ipcam.resolution as "1080p",
        },
      },
      //@ts-expect-error
      rawState: this.rawState,
    };
  }

  public handleCommand(command: Command) {
    let message: object;

    switch (command.type) {
      case "pause":
      case "resume":
      case "stop":
        message = {
          print: {
            sequence_id: "0",
            command: command.type,
          },
        };
        break;
      case "home":
        message = this.getGcodeMessage("G28");
        break;
      case "hotend_temperature":
      case "bed_temperature":
        message = this.getGcodeMessage(
          `${command.type === "hotend_temperature" ? "M104" : "M140"} S${
            command.target
          }`
        );
        break;
      case "chamber_light":
        message = {
          system: {
            sequence_id: "2003",
            command: "ledctrl",
            led_node: command.type,
            led_mode: command.state ? "on" : "off",
            led_on_time: 500,
            led_off_time: 500,
            loop_times: 0,
            interval_time: 0,
          },
        };
        break;
    }

    this.publishMtqqMessage(message);
  }
}
