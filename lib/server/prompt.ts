import { createInterface } from 'readline';

export async function promptYesNo(question: string) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(`${question} (y/n): `, (value) => {
      resolve(value);
    });
  });

  rl.close();

  const normalized = answer.trim().toLowerCase();
  if (normalized === 'y' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'n' || normalized === 'no') {
    return false;
  }
  console.log('Please answer with y or n.');
  return promptYesNo(question);
}
