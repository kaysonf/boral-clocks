import { LimitOrderRequest } from "../models/OrderRequest";
import { Sequenced } from "../system";
import { IOrderCore, Order } from "./Order";

export class LimitOrder implements IOrderCore {
  private _currentQuantity: Order["quantity"];

  constructor(
    private _orderRequest: Sequenced<LimitOrderRequest>,
    private _id: Order["id"],
    private _status: Order["status"]
  ) {
    this._currentQuantity = this._orderRequest.quantity;
  }

  public getId = () => this._id;

  public getSeqNo = () => this._orderRequest.seq_no;

  public getSide = () => this._orderRequest.side;

  public getType = () => this._orderRequest.type;

  public getPrice = () => this._orderRequest.price;

  public getCurrentQuantity = () => {
    return this._currentQuantity;
  };

  public decreaseQuantity = (delta: number) => {
    this._currentQuantity -= delta;
  };

  public toSerialized = () => ({
    ...this._orderRequest,
    id: this._id,
    status: this._status,
  });
}
