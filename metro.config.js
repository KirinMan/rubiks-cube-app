const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// three.jsをWebGPUビルドに強制解決し、@react-three/fiberはmoduleフィールド経由で
// 標準版(react-nativeフィールドではなく)を使う。react-native-webgpu公式サンプルの設定。
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('three')) {
    moduleName = 'three/webgpu';
  }

  if (platform !== 'web' && moduleName.startsWith('@react-three/fiber')) {
    return context.resolveRequest(
      {
        ...context,
        unstable_conditionNames: ['module'],
        mainFields: ['module'],
      },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
