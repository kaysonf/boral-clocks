import { Message } from "../Message";

export interface INetworkProtocol<Pub, Rec> {
  send: (m: Message<Pub>) => void;
  on?: (m: Message<Rec>) => void;
}
