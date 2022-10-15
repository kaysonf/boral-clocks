export class Sequence {
  private _seq_no = 0;

  getNext = () => this._seq_no + 1;

  getCurrent = () => this._seq_no;

  setSeqNo = (seq_no: number) => {
    this._seq_no = seq_no;
  };

  increment = () => {
    this._seq_no = this.getNext();
    return this._seq_no;
  };
}
