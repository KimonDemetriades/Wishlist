export default ({ config }) => {
  const isDevClient = process.env.EAS_BUILD_PROFILE === 'development';

  return {
    ...config,
    android: {
      ...config.android,
      package: isDevClient
        ? "com.kimon.listhappens.dev"   // dev client package
        : "com.kimon.listhappens"       // production package
    }
  };
};
