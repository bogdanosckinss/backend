export const isset = function (variable: any): boolean {
  return typeof variable !== 'undefined' && variable !== null
}
