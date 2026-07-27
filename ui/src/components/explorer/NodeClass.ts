/**
 * DO NOT USE OR IMPLEMENT UNTIL DYNAMIC HIERARCHY EXISTS OR THE CURRENT IMPLEMENTATION GROWS
 *
 * This is an idea dump, to be referred when needed.
 *
 * ## idea
 * - Nodes become class objects
 * - class knows how to update itself and get the entire tree updated internally
 *
 * It can:
 * - hold all entity level validation and DB interaction exposing a consistent API
 * - hold tree actions like expand parents or expand children  (or collapse)
 * - hold dirty flags, call methods on the Provider
 * - when a property is updated, it updates its local value and asks parent to replace it.
 * - the parent in turn moves the immutable mutation upwards into the tree
 *
 * ## Requirement
 *  - a store (map, over unique keys - currently not unique) in the module scope
 *
 *
 * ## Alternative design
 * ExternalSyncStore, where the data is an object but handled by one class and rendered via notify()
 *
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class NodeClass {
  public _children: NodeClass[] = [];

  private _id: number;
  private _clip_id: number;
  private _number: number | null;
  private _name: string;
  private _description: string | null;
  private _comments: string | null;
  private _added_on: number;
  private nodeIdMap: Map<number, NodeClass>;

  constructor(
    data: {
      id: number;
      clip_id: number;
      number: number | null;
      name: string;
      description: string | null;
      comments: string | null;
      added_on: number;
    },
    nodeIdMap: Map<number, NodeClass>,
  ) {
    this._id = data.id;
    this._clip_id = data.clip_id;
    this._number = data.number;
    this._name = data.name;
    this._description = data.description;
    this._comments = data.comments;
    this._added_on = data.added_on;
    this.nodeIdMap = nodeIdMap;
  }

  toJson() {
    return {
      id: this.id,
      clip_id: this._clip_id,
      number: this._number,
      name: this._name,
      description: this._description,
      comments: this._comments,
      added_on: this._added_on,
    };
  }

  public get name() {
    return this._name;
  }
  /**
   * example impl.
   * Batch updates and dirty flags pending
   */
  public set name(value: string) {
    this._name = value;
    this.notifyParent();
  }

  public get id(): number {
    return this._id;
  }
  public get clip_id() {
    return this._clip_id;
  }
  public get number() {
    return this._number;
  }

  public get description() {
    return this._description;
  }
  public get comments() {
    return this._comments;
  }
  public get added_on() {
    return this._added_on;
  }

  /**
   *
   * @param id to be used for communication
   */
  public _updateChild(id: number) {
    // replace child
    const childNode = this.nodeIdMap.get(id)!;
    const data = childNode.toJson();
    const newChild = new NodeClass(data, this.nodeIdMap);
    newChild._children = childNode._children;
    this.nodeIdMap.set(id, newChild);

    // replace children object
    const children = [...this._children].map((child) => (child.id === id ? newChild : child));
    this._children = children;
    this.notifyParent();
  }

  private notifyParent() {
    const parentNode = this.nodeIdMap.get(this.clip_id);
    parentNode?._updateChild(this.id);
  }
}
