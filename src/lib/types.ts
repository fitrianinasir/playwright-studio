export type TextBox = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type WhitelistReason = "dummy-pattern" | "content-mismatch";

export type WhitelistItem = {
  designText: string;
  liveText: string | null;
  reason: WhitelistReason;
  box: TextBox;
};

export type CompareRequest = {
  webpageUrl: string;
  targetId: string;
  figmaUrl: string;
};

export type CompareResponse = {
  accuracyRaw: number;
  accuracyWhitelisted: number;
  diffPixelsRaw: number;
  diffPixelsWhitelisted: number;
  totalPixels: number;
  whitelist: WhitelistItem[];
  webpageImage: string;
  designImage: string;
  diffImageRaw: string;
  diffImageWhitelisted: string;
  source: "figma-api" | "design-page";
  warnings: string[];
};
