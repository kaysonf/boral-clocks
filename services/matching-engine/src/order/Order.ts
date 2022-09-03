import { OrderRequest } from "../models/OrderRequest";
import { Sequenced } from "../system";

export type Order = {
  id: string;
  status: "ACTIVE" | "CANCELLED" | "FILLED" | "REJECTED";
  price: number;
} & OrderRequest;

export interface IOrderCore {
  getType: () => Order["type"];
  toOrder: () => Sequenced<Order>;
}
