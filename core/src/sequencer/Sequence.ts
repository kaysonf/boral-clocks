export class Sequence {
  private _seq_no = 0;
  getNext = () => this._seq_no + 1;
  setSeqNo = (seq_no: number) => {
    this._seq_no = seq_no;
  };
}
