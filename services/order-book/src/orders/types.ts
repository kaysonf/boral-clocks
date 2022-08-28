import { OrderRequest } from "../models/OrderRequest";
import { OperationResult, SystemConfig } from "../system";
import { PriorityQueue } from "../utils";

export type Order = {
  id: string;
  timestamp: number;
  status: "ACTIVE" | "CANCELLED";
  price: number;
} & OrderRequest;

export type CreateOrder = (params: {
  orderRequest: OrderRequest;

  bids: PriorityQueue<Order>;
  asks: PriorityQueue<Order>;

  systemConfig: SystemConfig;
}) => OperationResult<Order>;
