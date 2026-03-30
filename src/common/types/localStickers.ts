type Path = string;

type Sticker = {
  label: string;
  path: Path;
};

type Stickers = Sticker[];

type StickerPack = {
  label: string;
  icon?: Path;
  index: number;
  dirPath: Path;
  stickers: Stickers;
};

type StickerPathItem = {
  label: string;
  path: string;
  children?: StickerPathItem[];
};

type StickerStore =
  | {
      status: "success";
      stickerPacks: StickerPack[];
      msg?: never;
    }
  | {
      status: "info" | "failed";
      stickerPacks?: never;
      msg: string;
    };

export type { Path, Sticker, Stickers, StickerPack, StickerStore, StickerPathItem };
