export interface Result<T> {
  message: string;
  type: boolean;
  result?: T
}