export function toMenuId(name: string) {
  return name.replaceAll(' ', '-').toLowerCase();
}
