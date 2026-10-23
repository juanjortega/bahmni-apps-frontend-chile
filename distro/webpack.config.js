const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { NxReactWebpackPlugin } = require('@nx/react/webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const webpack = require('webpack');
const { join, resolve } = require('path');

module.exports = (env, argv) => {
  //TODO to read this from docker compose
  //TODO should we hardcode?
  const publicPath = env.PUBLIC_PATH || process.env.PUBLIC_PATH || '/bahmni-v2/';
  const isDevelopment = argv.mode !== 'production';
  // Desarrollo contra un Bahmni que no está en https://localhost (p. ej. el lab FHIR por túnel ssh,
  // BAHMNI_TARGET=http://127.0.0.1:18080/) y con la config del centro desde una carpeta local
  // (BAHMNI_CONFIG_DIR=<carpeta que contiene openmrs/>), servida en /bahmni_config.
  const bahmniTarget = process.env.BAHMNI_TARGET || 'https://localhost/';
  // resolve: en Windows "C:/..." parece una URL para webpack-dev-server; "C:\..." no.
  const bahmniConfigDir = process.env.BAHMNI_CONFIG_DIR && resolve(process.env.BAHMNI_CONFIG_DIR);
  // Sesión de OpenMRS fija para el proxy (BAHMNI_DEV_JSESSIONID): reemplaza el JSESSIONID del navegador,
  // que es HttpOnly y no se puede pisar desde la consola, y sirve para pruebas automáticas sin login.
  const devSessionId = process.env.BAHMNI_DEV_JSESSIONID;
  const withDevSession = (proxyReq) => {
    const others = (proxyReq.getHeader('cookie') || '')
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c && !c.startsWith('JSESSIONID='));
    proxyReq.setHeader('cookie', [...others, `JSESSIONID=${devSessionId}`].join('; '));
  };

  return {
    output: {
      path: join(__dirname, 'dist'),
      publicPath: publicPath,
      clean: true,
    },
    resolve: {
      alias: isDevelopment ? {
        '@bahmni/home-app': join(__dirname, '../apps/home/src'),
        '@bahmni/clinical-app': join(__dirname, '../apps/clinical/src'),
        '@bahmni/registration-app': join(__dirname, '../apps/registration/src'),
        '@bahmni/appointments-app': join(__dirname, '../apps/appointments/src'),
        '@bahmni/command-palette-app': join(__dirname, '../apps/command-palette/src'),
        '@bahmni/patient-documents-app': join(__dirname, '../apps/patient-documents/src'),
        '@bahmni/admin-app': join(__dirname, '../apps/admin/src'),
        '@bahmni/reports-app': join(__dirname, '../apps/reports/src'),
      } : {},
    },
    devServer: {
      port: 3000,
      historyApiFallback: {
        index: '/bahmni-v2/index.html',
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
      },
      static: bahmniConfigDir
        ? [{ directory: bahmniConfigDir, publicPath: '/bahmni_config', watch: true }]
        : false,
      proxy: [
        {
          context: (pathname) =>
            !pathname.startsWith(publicPath) &&
            !(bahmniConfigDir && pathname.startsWith('/bahmni_config/')),
          target: bahmniTarget,
          // webpack-dev-server 5 trae http-proxy-middleware 2 (onProxyReq); el 3 usa on.proxyReq.
          ...(devSessionId
            ? { onProxyReq: withDevSession, on: { proxyReq: withDevSession } }
            : {}),
          changeOrigin: true,
          secure: false,
          logLevel: 'debug',
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PUBLIC_URL': JSON.stringify(publicPath),
        'process.env.PUBLIC_PATH': JSON.stringify(publicPath),
      }),
      new NxAppWebpackPlugin({
        tsConfig: './tsconfig.app.json',
        compiler: 'babel',
        main: './src/main.tsx',
        index: './src/index.html',
        baseHref: publicPath,
        assets: [
          './src/assets',
          { input: isDevelopment ? '../apps/home/public/locales' : '../apps/home/dist/locales', glob: '**/*', output: 'home/locales' },
          { input: isDevelopment ? '../apps/clinical/public/locales' : '../apps/clinical/dist/locales', glob: '**/*', output: 'clinical/locales' },
          { input: isDevelopment ? '../apps/registration/public/locales' : '../apps/registration/dist/locales', glob: '**/*', output: 'registration/locales' },
          { input: isDevelopment ? '../apps/appointments/public/locales' : '../apps/appointments/dist/locales', glob: '**/*', output: 'appointments/locales' },
          { input: isDevelopment ? '../apps/command-palette/public/locales' : '../apps/command-palette/dist/locales', glob: '**/*', output: 'command-palette/locales' },
          { input: isDevelopment ? '../apps/patient-documents/public/locales' : '../apps/patient-documents/dist/locales', glob: '**/*', output: 'document-upload/locales' },
          { input: isDevelopment ? '../apps/admin/public/locales' : '../apps/admin/dist/locales', glob: '**/*', output: 'admin/locales' },
          { input: isDevelopment ? '../apps/reports/public/locales' : '../apps/reports/dist/locales', glob: '**/*', output: 'reports/locales' },
        ],
        styles: ['./src/styles.scss'],
        outputHashing:
          process.env['NODE_ENV'] === 'production' ? 'all' : 'none',
        optimization: process.env['NODE_ENV'] === 'production',
      }),
      new NxReactWebpackPlugin({
        // Uncomment this line if you don't want to use SVGR
        // See: https://react-svgr.com/
        // svgr: false
      }),
      ...(!isDevelopment ? [
        new InjectManifest({
          swSrc: join(__dirname, 'src/service-worker.ts'),
          swDest: 'service-worker.js',
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          exclude: [/\.map$/, /^manifest.*\.js$/],
        }),
      ] : []),
    ],
  };
};
