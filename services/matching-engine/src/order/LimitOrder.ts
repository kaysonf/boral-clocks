import { LimitOrderRequest } from "../models/OrderRequest";
import { Sequenced } from "../system";
import { IOrderCore, Order } from "./Order";

export class LimitOrder implements IOrderCore {
  constructor(
    private _orderRequest: Sequenced<LimitOrderRequest>,
    private _id: string,
    private _status: Order["status"]
  ) {}

  public getType = () => this._orderRequest.type;

  public toOrder = () => ({
    ...this._orderRequest,
    id: this._id,
    status: this._status,
  });
}
