export class EmotionWindow {
  private window: string[];
  private readonly size: number;

  constructor(size = 5) {
    this.size = size;
    this.window = [];
  }

  push(emotion: string) {
    this.window.push(emotion);
    if (this.window.length > this.size) {
      this.window.shift();
    }
  }

  getStable(): string | null {
    if (this.window.length === 0) return null;

    const counts = new Map<string, number>();
    for (const e of this.window) {
      counts.set(e, (counts.get(e) ?? 0) + 1);
    }

    let maxEmotion: string | null = null;
    let maxCount = 0;
    for (const [emotion, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        maxEmotion = emotion;
      }
    }

    const threshold = Math.ceil(this.size / 2);
    return maxCount >= threshold ? maxEmotion : null;
  }

  clear() {
    this.window = [];
  }
}
