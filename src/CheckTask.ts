export class Task<T> {
  public state: string = "pending";
  public err = undefined;
  constructor(public name: string, public task: Promise<T>) {
    task.then(
      (_) => (this.state = "done"),
      (_) => {
        (this.state = "failed"), (this.err = _);
      }
    );
  }
}
export class CheckTask<T> extends Task<T> {
  check: boolean | undefined = undefined;
  constructor(public name: string, public task: Promise<T>, public wanted: T) {
    super(name, task);
    this.task.then((re) => {
      this.check = re === wanted;
    });
  }
  then<R>(
    fun: (task: Task<T>) => R,
    onError?: (task: Task<T>) => R
  ): Promise<any> {
    return this.task.then(
      (_) => fun(this),
      (_) => onError?.(this)
    );
  }
}
