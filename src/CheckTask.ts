import { Action } from "./Action";

export class Task<T> {
  public state: string = "pending";
  public err = undefined;
  constructor(public name: string, public task: Promise<T>) {
    task.then(
      (_) => (this.state = "done")).catch(
      (_) => {
        this.state = "failed";
        this.err = _;
      })
    ;
  }
}
export class CheckTask<T> extends Task<T> {
  check: boolean | undefined = undefined;

  constructor(
    public name: string,
    public task: Promise<T>,
    public wanted: T,
    public actions: Action[] = []
  ) {
    super(name, task);
    this.task.then((re) => {
      this.check = re === wanted;
    })
    //MARK 必须要有，因为：
    //MARK promise.then.catch
    //MARK promise.then; promise.catch
    //MARK 上面两者不一样，下者，promise.then生成了一个新promise，而这个promise没有catch。
    .catch(err=>{})
  }
  
}
