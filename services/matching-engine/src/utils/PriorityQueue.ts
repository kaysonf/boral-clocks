/**
 * https://gist.github.com/leebyron/0a7a2aaa51dcb5b02bc0b9a40188af79
 * For compare function return:
 * - Less than zero: item1 has higher priority than item2.
 * - Zero: same.
 * - Greater than zero: item1 has lower priority than item2.
 */
type CompareFunction<T> = (item1: T, item2: T) => number;

export class PriorityQueue<T> {
  _items: Array<T>;
  _compare: CompareFunction<T>;

  constructor(compare: CompareFunction<T>) {
    this._items = [];
    this._compare = compare;
  }

  enqueue(item: T): void {
    let child = this._items.push(item) - 1;
    // Satisfy heap by recursively comparing to parent node.
    while (child !== 0) {
      const parent = (child - 1) >>> 1;
      if (this._priority(parent, child) === parent) {
        break;
      }
      this._swap(parent, child);
      child = parent;
    }
  }

  dequeue(): T | undefined {
    const length = this._items.length;

    if (length === 0) return undefined;

    if (length !== 0) {
      this._swap(0, length - 1);
      const result = this._items.pop();
      // Satisfy heap by recursively comparing to child nodes.
      let parent = 0;
      while (true) {
        const child = (parent << 1) + 1;
        const high = this._priority(this._priority(parent, child), child + 1);
        if (high === parent) {
          break;
        }
        this._swap(parent, high);
        parent = high;
      }
      return result;
    }
  }

  size(): number {
    return this._items.length;
  }

  peek(): T | undefined {
    return this._items[0];
  }

  items() {
    return this._items;
  }

  _priority(parent: number, child: number): number {
    return child < this._items.length &&
      this._compare(this._items[parent], this._items[child]) > 0
      ? child
      : parent;
  }

  _swap(parent: number, child: number): void {
    const temp = this._items[parent];
    this._items[parent] = this._items[child];
    this._items[child] = temp;
  }
}
