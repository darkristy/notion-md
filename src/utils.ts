export const parallel = (items: any, handler: any, concurrency: any) => {
  if (!Number.isInteger(concurrency) || concurrency < 1)
    throw new Error("concurrency must be a positive integer greater than 0");
  if (items.length === 0) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const results = [] as any;
    let i = 0;

    const next = (result: any) => {
      results.push(result);
      if (i < items.length) {
        try {
          handler(items[i++]).then(next).catch(reject);
        } catch (error) {
          reject(error);
        }
      } else if (results.length === items.length) resolve(results);
    };

    for (let x = 0; x < Math.min(concurrency, items.length); x++) {
      try {
        handler(items[i++]).then(next).catch(reject);
      } catch (error) {
        reject(error);
        break;
      }
    }
  });
};
