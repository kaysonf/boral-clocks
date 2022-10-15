export type Message<T> = {
  type: "ACK" | "PUBLISH";
  publisher: string;
  topic: string;
  seq_no: number;
  message: T;
};

export interface Messaging<Pub, Rec> {
  publish: (m: Pub) => void;
  onReceieve: (m: Message<Rec>) => void;
}
