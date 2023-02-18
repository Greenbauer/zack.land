export function menuNameToId(name: string) {
  return name.replaceAll(' ', '-').toLowerCase();
}
