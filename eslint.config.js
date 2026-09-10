const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');
module.exports = defineConfig([expoConfig,{ignores:['dist/**','coverage/**','.expo/**','supabase/functions/**'],rules:{'no-console':['warn',{allow:['warn','error']}]}}]);
