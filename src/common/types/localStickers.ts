type Path = string;

type Sticker = {
  id: string;
  name: string;
  path: Path;
  index?: number;
};

type Stickers = Sticker[];

type StickerPack = {
  id: string;
  name: string;
  icon: Path;
  index?: number;
  stickers: Stickers;
};

type StickerStore = {
  recent: Stickers;
  stickers: StickerPack[];
  errMsg?: string;
};

export type { Path, Sticker, Stickers, StickerPack, StickerStore };
