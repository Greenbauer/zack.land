export function setMenuId(name: string): string {
  return name.replaceAll(' ', '-').toLowerCase();
}
