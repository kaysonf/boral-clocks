import { OrderRequest } from "./OrderRequest";

export type Order = {
  seq_no: number;
  status: "ACTIVE" | "CANCELLED" | "FILLED" | "REJECTED";
  price: number;
} & OrderRequest;
