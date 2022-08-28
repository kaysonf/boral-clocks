import { Order } from "./Order";

type OrderAddedEvent = {
  type: "added";
  data: Order;
};

type OrderCancelledEvent = {
  type: "cancelled";
  data: Order;
};

type TransactionEvent = {
  type: "transaction";
  data: {
    ask: Order;
    bid: Order;
  };
};

export type BookEvent =
  | OrderAddedEvent
  | OrderCancelledEvent
  | TransactionEvent;
