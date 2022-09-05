import { Message } from "./Message";
import { INetworkProtocol } from "./network/INetworkProtocol";
import { Sequence } from "./Sequence";

export class Contributor<Pub, Rec> {
  private _sequence = new Sequence();

  private _resendQueue: Pub[] = [];

  constructor(
    private _networkProtocol: INetworkProtocol<Pub, Rec>,
    private _publisher: string,
    private _topic: string,
    private _onReceieve: (m: Message<Rec>) => void
  ) {
    this._networkProtocol.on = this.onReceieve;
  }

  publish = (m: Pub) => {
    this._networkProtocol.send(
      this.preparePubMessage(
        m,
        this._sequence.getNext() + this._resendQueue.length
      )
    );

    this._resendQueue.push(m);
  };

  private onReceieve = (m: Message<Rec>) => {
    const outOfSequence =
      m.publisher !== this._publisher && m.seq_no > this._sequence.getNext();

    this._sequence.setSeqNo(m.seq_no);

    if (outOfSequence) {
      this.resendMessagesInQueue();
    } else {
      this._resendQueue.shift();
    }

    this._onReceieve(m);
  };

  private preparePubMessage = (m: Pub, seq_no: number): Message<Pub> => ({
    type: "PUBLISH",
    publisher: this._publisher,
    topic: this._topic,
    seq_no,
    message: m,
  });

  private resendMessagesInQueue() {
    this._resendQueue.forEach((m, idx) => {
      this._networkProtocol.send(
        this.preparePubMessage(m, this._sequence.getNext() + idx)
      );
    });
  }
}
