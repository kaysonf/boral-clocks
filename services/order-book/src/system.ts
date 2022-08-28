export type SystemConfig = {
  getCurrentTimestamp: () => number;
  getOrderId: () => string;
};

export type OperationResult<T> =
  | {
      status: "success";
      data: T;
    }
  | { status: "failure"; message: string };
