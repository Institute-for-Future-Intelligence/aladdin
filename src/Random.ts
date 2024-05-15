/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

export class Random {
  // return a random number in a normal distribution with mean = 0 and variance = 1 using the Box-Muller transform.
  public static gaussian(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  // return two random numbers in a normal distribution with mean = 0 and variance = 1 using the Box-Muller transform.
  public static twoGaussians(): number[] {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    const r: number[] = new Array(2);
    const a = Math.sqrt(-2.0 * Math.log(u));
    const b = 2.0 * Math.PI * v;
    r[0] = a * Math.cos(b);
    r[1] = a * Math.sin(b);
    return r;
  }

  // return a random number in a poisson distribution with the specified lambda.
  public static poisson(lambda: number): number {
    let x = 0,
      p = Math.exp(-lambda),
      s = p;
    const u = Math.random();
    while (u > s) {
      x++;
      p *= lambda / x;
      s += p;
    }
    return x;
  }
}
