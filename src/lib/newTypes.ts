import { BrowserName, DevicePreset, ScenarioStep } from "./studio-types";

export type Scenario = {
  id?: string;
  user_id: string;
  name: string;
  description: string;
  steps?: ScenarioStep[];
  browsers: BrowserName[];
  device: DevicePreset | string;
};
