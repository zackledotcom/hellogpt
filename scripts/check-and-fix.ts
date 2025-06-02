async function enforceTailwindJIT(): Promise<CheckResult> {
  const id = 'tailwindJIT';
  if (!(await exists(paths.tailwindConfig))) {
    return { id, passed: false, message: 'tailwind.config.ts not found' };
  }

  const content = await readFile(paths.tailwindConfig, 'utf-8');

  // Check if it's Tailwind v2-style config that needs mode: 'jit'
  const needsMode = content.includes('mode:') && content.includes('jit');

  if (!content.includes('mode:') || needsMode) {
    log.success('Tailwind JIT mode is already active (or unnecessary in v3+).');
    return { id, passed: true };
  }

  if (shouldFix) {
    const fixed = content.replace(/mode:\s*['"]\w+['"],?/, "mode: 'jit',");
    await writeFile(paths.tailwindConfig, fixed, 'utf-8');
    log.fix('Forced mode: "jit" in tailwind.config.ts');
    return { id, passed: true, fixed: true };
  }

  return {
    id,
    passed: false,
    message: 'Tailwind JIT not set; add `mode: \'jit\'` if using Tailwind v2.',
  };
}

