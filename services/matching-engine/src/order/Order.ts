import { OrderRequest } from "../models/OrderRequest";
import { Sequenced } from "../system";

export type Order = {
  id: string;
  status: "ACTIVE" | "CANCELLED" | "FILLED" | "REJECTED";
  price: number;
} & OrderRequest;

export type OrderFulfilled = Pick<Order, "id" | "side" | "price" | "quantity">;

export interface IOrderCore {
  getSeqNo: () => Sequenced<Order>["seq_no"];
  getId: () => Order["id"];
  getSide: () => Order["side"];
  getType: () => Order["type"];
  getPrice: () => Order["price"];
  getCurrentQuantity: () => Order["quantity"];
  decreaseQuantity: (delta: Order["quantity"]) => void;
  toSerialized: () => Sequenced<Order>;
}
