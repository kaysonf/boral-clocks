import { MarketOrderRequest } from "../models/OrderRequest";
import { Sequenced } from "../system";
import { IOrderCore, Order } from "./Order";

export class MarketOrder implements IOrderCore {
  private _currentQuantity: Order["quantity"];

  constructor(
    private _orderRequest: Sequenced<MarketOrderRequest>,
    private _id: Order["id"],
    private _status: Order["status"],
    private _bestMarketPrice: () => number
  ) {
    this._currentQuantity = this._orderRequest.quantity;
  }

  public getStatus = () => this._status;

  public setStatus = (status: Order["status"]) => {
    this._status = status;
  };

  public getId = () => this._id;

  public getSeqNo = () => this._orderRequest.seq_no;

  public getSide = () => this._orderRequest.side;

  public getType = () => this._orderRequest.type;

  public getPrice = () => this._bestMarketPrice();

  public getCurrentQuantity = () => {
    return this._currentQuantity;
  };

  public decreaseQuantity = (delta: number) => {
    this._currentQuantity -= delta;
  };

  public toSerialized = () => {
    return {
      ...this._orderRequest,
      id: this._id,
      status: this._status,
    };
  };
}
