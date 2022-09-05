export type Message<T> = {
  type: "ACK" | "PUBLISH";
  publisher: string;
  topic: string;
  seq_no: number;
  message: T;
};
