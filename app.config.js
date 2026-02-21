export default ({ config }) => {
  const isDevClient = process.env.EAS_BUILD_PROFILE === 'development';

  return {
    ...config,
    android: {
      ...config.android,
      package: isDevClient
        ? "com.ListHappens.app.dev"   // dev client package
        : "com.ListHappens.app"       // production package
    }
  };
};
