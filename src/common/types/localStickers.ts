type Path = string;

type Sticker = {
  name: string;
  path: Path;
};

type Stickers = Sticker[];

type StickerPack = {
  title: string;
  icon?: Path;
  index?: number;
  dirPath: Path;
  stickers: Stickers;
};

type StickerStore =
  | {
      status: "success";
      stickerPack: StickerPack[];
      msg?: never;
    }
  | {
      status: "info" | "failed";
      stickerPack?: never;
      msg: string;
    };

export type { Path, Sticker, Stickers, StickerPack, StickerStore };
