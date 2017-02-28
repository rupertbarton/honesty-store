import fetch from '../../../service/src/fetch';

interface BoxItem {
  itemId: string;
  count: number;
}

type yyyymmdd = string;

export interface Box {
  id: string;
  items: BoxItem[];
  packed: yyyymmdd;
  shipped: yyyymmdd;
  recieved: yyyymmdd;
  closed?: yyyymmdd;
}

const { get, post } = fetch('box');

export const getBox = (key, boxId: string) =>
  get<Box>(1, key, `/${boxId}`);

export const flagOutOfStock = ({ key, boxId, itemId }) =>
  post<{}>(1, key, `/out-of-stock/${boxId}/${itemId}`, {});
