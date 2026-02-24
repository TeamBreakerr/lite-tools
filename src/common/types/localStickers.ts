type Path = string;

type Sticker = {
  name: string;
  path: Path;
};

type Stickers = Sticker[];

type StickerPack = {
  title: string;
  icon?: string;
  index?: number;
  dirPath: string;
  stickers: Stickers;
};

type StickerStore = {
  recentStickers: Stickers;
  stickerPack: StickerPack[];
  errMsg?: string;
};

export type { Path, Sticker, Stickers, StickerPack, StickerStore };
