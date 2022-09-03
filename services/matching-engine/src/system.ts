export type OperationResult<T> =
  | {
      status: "success";
      data: T;
    }
  | { status: "failure"; message: string };

export type Sequenced<T extends Record<string, unknown>> = {
  seq_no: number;
} & T;
