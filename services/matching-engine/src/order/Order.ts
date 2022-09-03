import { OrderRequest } from "../models/OrderRequest";
import { Sequenced } from "../system";

export type Order = {
  id: string;
  status: "ACTIVE" | "CANCELLED" | "FILLED" | "REJECTED";
} & OrderRequest;

export type OrderFulfilled = Pick<Order, "id" | "side" | "quantity"> & {
  price: number;
};

export interface IOrderCore {
  getSeqNo: () => Sequenced<Order>["seq_no"];
  getId: () => Order["id"];
  getSide: () => Order["side"];
  getType: () => Order["type"];
  getPrice: () => number;
  getCurrentQuantity: () => Order["quantity"];
  decreaseQuantity: (delta: Order["quantity"]) => void;
  toSerialized: () => Sequenced<Order>;
}
