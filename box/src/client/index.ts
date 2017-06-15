import fetch from '@honesty-store/service/lib/fetch';

export interface BatchReference {
  id: string;
  count: number;
}
export interface BoxItemWithBatchReference {
  itemID: string;
  batches: BatchReference[];
}
export interface FixedBoxItemOverheads {
  shippingCost: number;
  warehousingCost: number;
  packagingCost: number;
  packingCost: number;
  serviceFee: number;
}
export interface VariableBoxItemOverheads {
  creditCardFee: number;
  wholesaleCost: number;
  subtotal: number;
  VAT: number;
  donation: number;
  total: number;
}
export type Donatable = {
  donationRate: number;
};
export type ShippingDetails = {
  shippingCost: number;
  packed?: number;
  shipped?: number;
  received?: number;
  closed?: number;
};
export type BoxItem = BoxItemWithBatchReference & FixedBoxItemOverheads & VariableBoxItemOverheads & {
  count: number;
  depleted?: number;
  expiry: number;
};

export type ShippedBoxSubmission = ShippingDetails & Donatable & {
  boxItems: BoxItemWithBatchReference[];
};
export type MarketplaceBoxSubmission = Donatable & {
  boxItem: BoxItemWithBatchReference;
};
// this is duplicated in aws/src/table/table.ts
export type Box = ShippingDetails & Donatable & {
  boxItems: BoxItem[];
  count: number;
  storeId: string;
  version: number;
  id: string;
};

import { lambdaBaseUrl } from '@honesty-store/service/lib/baseUrl';

const { get, post, put } = fetch('box', lambdaBaseUrl);

export const flagOutOfStock = ({ key, boxId, itemId, depleted }) =>
  post<{}>(1, key, `/${boxId}/out-of-stock/${itemId}/${depleted}`, {});

export const markBoxAsReceived = (key, boxId: string) =>
  post<{}>(1, key, `/${boxId}/received`, {});

export const markBoxAsShipped = (key, boxId: string, date: number) =>
  put<{}>(1, key, `/${boxId}/shipped/${date}`, {});

export const createShippedBox = (key, storeId: string, submission: ShippedBoxSubmission, dryRun: boolean) =>
  post<Box>(1, key, `/store/${storeId}/shipped`, { ...submission, dryRun });

export const createMarketplaceBox = (key, storeId: string, submission: MarketplaceBoxSubmission, dryRun: boolean) =>
  post<Box>(1, key, `/store/${storeId}/marketplace`, { ...submission, dryRun });

export const getBoxesForStore = async (key, storeId: string, filter: (box: Box) => boolean) => {
  const boxes = await get<Box[]>(1, key, `/store/${storeId}`);
  return boxes.filter(filter);
};

export const getBox = (key, boxId: string) =>
  get<Box>(1, key, `/${boxId}`);
