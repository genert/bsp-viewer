export default function (tokens) {
  return {
    funcName: tokens.next().toLowerCase(),
    base: parseFloat(tokens.next()),
    amp: parseFloat(tokens.next()),
    phase: parseFloat(tokens.next()),
    freq: parseFloat(tokens.next())
  };
}
