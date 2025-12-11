export const greeting = (name: string): string => {
  return `Hello, ${name}!`;
};

export const constants = {
  APP_NAME: 'Guan Dan OS',
  VERSION: '0.0.1',
} as const;
