module.exports = {
  presets: [
    [
      '@babel/preset-react',
      {
        runtime: 'classic', // Use classic JSX transform
      },
    ],
    '@babel/preset-env',
  ],
};
