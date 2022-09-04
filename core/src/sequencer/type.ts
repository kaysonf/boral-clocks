export type Sequenced<T extends Record<string, unknown>> = {
  seq_no: number;
} & T;
