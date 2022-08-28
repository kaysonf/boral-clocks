export type OperationResult<T> =
  | {
      status: "success";
      data: T;
    }
  | { status: "failure"; message: string };
