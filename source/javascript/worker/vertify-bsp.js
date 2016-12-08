export default function (header) {
  if (header.tag !== 'IBSP' || header.version !== 47) {
    return false;
  }

  return true;
}
