declare module 'lunar-javascript' {
  export class Lunar {
    /** Negative for a leap month. */
    getMonth(): number
    getDay(): number
    /** Solar term name when the day starts one, otherwise an empty string. */
    getJieQi(): string
  }

  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar
    getLunar(): Lunar
    next(days: number): Solar
  }
}
