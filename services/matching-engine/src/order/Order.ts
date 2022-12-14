import { Sequenced } from "@core/sequencer";
import { OrderRequest } from "@matching-engine/models";

export type Order = {
  id: string;
  status: "ACTIVE" | "CANCELLED" | "FILLED" | "REJECTED";
} & OrderRequest;

export type OrderFilled = Pick<Order, "id" | "side" | "quantity"> & {
  price: number;
};

export interface IOrderCore {
  getSeqNo: () => Sequenced<Order>["seq_no"];
  getStatus: () => Order["status"];
  setStatus: (status: Order["status"]) => void;
  getId: () => Order["id"];
  getSide: () => Order["side"];
  getType: () => Order["type"];
  getPrice: () => number;
  getCurrentQuantity: () => Order["quantity"];
  decreaseQuantity: (delta: Order["quantity"]) => void;
  toSerialized: () => Sequenced<Order>;
}
