function chunkByPredicate(seed, predicate) {
  const chunks = [];
  seed.forEach((url, index) => {
    if (Array.isArray(chunks[predicate(index)])) {
      chunks[predicate(index)].push(url);
    } else {
      chunks[predicate(index)] = [url];
    }
  });
  return chunks;
}

function chunkByIndex(seed, numChunks) {
  return chunkByPredicate(seed, index => index % numChunks);
}

module.exports = {
  chunkByIndex,
  chunkByPredicate
};
