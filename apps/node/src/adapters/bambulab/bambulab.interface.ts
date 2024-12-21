export enum BambulabModel {
  A1Mini = "a1_mini",
  A1 = "a1",
}

export interface Message {
  topic: string;
  payload: ReportPayload;
}

export interface ReportPayload {
  print: BambulabState;
}

export interface BambulabState {
  ams: Ams;
  ams_rfid_status: number;
  ams_status: number;
  bed_target_temper: number;
  bed_temper: number;
  big_fan1_speed: string;
  big_fan2_speed: string;
  cali_version: number;
  chamber_temper: number;
  command: string;
  cooling_fan_speed: string;
  fan_gear: number;
  filam_bak: any[];
  force_upgrade: boolean;
  gcode_file: string;
  gcode_file_prepare_percent: string;
  gcode_state: "IDLE" | "PREPARE" | "RUNNING" | "PAUSE" | "FINISH" | "FAILED";
  heatbreak_fan_speed: string;
  hms: any[];
  home_flag: number;
  hw_switch_state: number;
  ipcam: Ipcam;
  layer_num: number;
  lifecycle: string;
  lights_report: LightsReport[];
  mc_percent: number;
  mc_print_line_number: string;
  mc_print_stage: string;
  mc_print_sub_stage: number;
  mc_remaining_time: number;
  mess_production_state: string;
  msg: number;
  nozzle_diameter: string;
  nozzle_target_temper: number;
  nozzle_temper: number;
  nozzle_type: string;
  online: Online;
  print_error: number;
  print_type: string;
  profile_id: string;
  project_id: string;
  queue_est: number;
  queue_number: number;
  queue_sts: number;
  queue_total: number;
  s_obj: any[];
  sdcard: boolean;
  sequence_id: string;
  spd_lvl: number;
  spd_mag: number;
  stg: any[];
  stg_cur: number;
  subtask_id: string;
  subtask_name: string;
  task_id: string;
  total_layer_num: number;
  upgrade_state: UpgradeState;
  upload: Upload;
  vt_tray: VtTray;
  wifi_signal: string;
  xcam: Xcam;
}

export interface AmsItem {
  id: string;
  humidity: string;
  temp: string;
  tray: Tray[];
}

export interface Tray {
  id: string;
  remain?: number;
  k?: number;
  n?: number;
  cali_idx?: number;
  tag_uid?: string;
  tray_id_name?: string;
  tray_info_idx?: string;
  tray_type?: string;
  tray_sub_brands?: string;
  tray_color?: string;
  tray_weight?: string;
  tray_diameter?: string;
  tray_temp?: string;
  tray_time?: string;
  bed_temp_type?: string;
  bed_temp?: string;
  nozzle_temp_max?: string;
  nozzle_temp_min?: string;
  xcam_info?: string;
  tray_uuid?: string;
  ctype?: number;
  cols?: string[];
}

export interface Ams {
  ams: AmsItem[];
  ams_exist_bits: string;
  insert_flag: boolean;
  power_on_flag: boolean;
  tray_exist_bits: string;
  tray_is_bbl_bits: string;
  tray_now: string;
  tray_pre: string;
  tray_read_done_bits: string;
  tray_reading_bits: string;
  tray_tar: string;
  version: number;
}

export interface Ipcam {
  ipcam_dev: string;
  ipcam_record: string;
  mode_bits: number;
  resolution: string;
  timelapse: string;
  tutk_server: string;
}

export interface LightsReport {
  mode: string;
  node: string;
}

export interface Online {
  ahb: boolean;
  rfid: boolean;
  version: number;
}

export interface UpgradeState {
  consistency_request: boolean;
  cur_state_code: number;
  dis_state: number;
  err_code: number;
  force_upgrade: boolean;
  message: string;
  module: string;
  new_ver_list: any[];
  new_version_state: number;
  progress: string;
  sequence_id: number;
  status: string;
}

export interface Upload {
  message: string;
  progress: number;
  status: string;
}

export interface VtTray {
  bed_temp: string;
  bed_temp_type: string;
  cali_idx: number;
  id: string;
  k: number;
  n: number;
  nozzle_temp_max: string;
  nozzle_temp_min: string;
  remain: number;
  tag_uid: string;
  tray_color: string;
  tray_diameter: string;
  tray_id_name: string;
  tray_info_idx: string;
  tray_sub_brands: string;
  tray_temp: string;
  tray_time: string;
  tray_type: string;
  tray_uuid: string;
  tray_weight: string;
  xcam_info: string;
}

export interface Xcam {
  buildplate_marker_detector: boolean;
}
