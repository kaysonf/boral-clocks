import { SystemData } from "../system";
import { OrderRequest } from "./OrderRequest";

export type Order = {
  status: "ACTIVE" | "CANCELLED" | "FILLED" | "REJECTED";
  price: number;
} & SystemData &
  OrderRequest;
