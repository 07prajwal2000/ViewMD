import { expect, test } from 'bun:test';
import { getCopyPath } from './fileAccess';

test('getCopyPath prefixes the opened folder, else falls back to the name', async () => {
  const file = { name: 'a.md' } as FileSystemHandle;
  const root = (segments: string[] | null) =>
    ({ name: 'proj', resolve: async () => segments }) as unknown as FileSystemDirectoryHandle;

  expect(await getCopyPath(file, root(['docs', 'a.md']))).toBe('proj/docs/a.md');
  expect(await getCopyPath(file, root(null))).toBe('a.md');
  expect(await getCopyPath(file, null)).toBe('a.md');
});
