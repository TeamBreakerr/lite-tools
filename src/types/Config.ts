import configJson from "@/assets/config.template.json";

type BaseConfig = typeof configJson;

type ExtendedConfig = Omit<BaseConfig, "chatFuncBar" | "topFuncBar"> & {
  topFuncBar: {
    name: string;
    enabled?: boolean;
  }[];
  chatFuncBar: {
    name: string;
    enabled?: boolean;
  }[];
};

export type Config = ExtendedConfig;
