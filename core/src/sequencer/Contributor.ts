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

  // TODO what if i dont get a response?
  // TODO what if response is of previous seq_no?
  // maybe consider sending 1 message at a time only, wait for responses
  publish = (m: Pub) => {
    if (this._resendQueue.length === 0) {
      this._networkProtocol.send(
        this.preparePubMessage(m, this._sequence.getNext())
      );
    }

    this._resendQueue.push(m);
  };

  // TODO what if i dont get a response?
  // TODO what if response is of previous seq_no?
  private onReceieve = (m: Message<Rec>) => {
    // TODO check based on msg type
    // ACK with same sequence
    // PUBLISH with next expected sequence

    switch (m.type) {
      case "ACK": {
        /**
         * 1 ->
         * <- 1 ACK
         */

        const inSequence = m.seq_no === this._sequence.getNext();

        if (inSequence) {
          this._resendQueue.shift();
          this._sequence.setSeqNo(this._sequence.getNext());
        }

        this.sendNextMessageInQueue();

        break;
      }

      case "PUBLISH": {
        const outOfSequence = m.seq_no !== this._sequence.getNext();

        this._sequence.setSeqNo(m.seq_no);

        if (!outOfSequence) {
          this._resendQueue.shift();
        }

        this.sendNextMessageInQueue();

        this._onReceieve(m);

        break;
      }
    }
  };

  private preparePubMessage = (m: Pub, seq_no: number): Message<Pub> => ({
    type: "PUBLISH",
    publisher: this._publisher,
    topic: this._topic,
    seq_no,
    message: m,
  });

  private sendNextMessageInQueue = () => {
    if (this._resendQueue.length > 0) {
      const message = this._resendQueue[0];
      this._networkProtocol.send(
        this.preparePubMessage(message, this._sequence.getNext())
      );
    }
  };
}
