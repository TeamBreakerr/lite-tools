import configJson from "@/assets/config.template.json";

type BaseConfig = typeof configJson;

type FuncBar = {
  name: string;
  id: string;
  enabled?: boolean;
};

type ExtendedConfig = Omit<BaseConfig, "chatFuncBar" | "topFuncBar"> & {
  topFuncBar: FuncBar[];
  chatFuncBar: FuncBar[];
};

type Config = ExtendedConfig;

export type { FuncBar, Config, BaseConfig };
