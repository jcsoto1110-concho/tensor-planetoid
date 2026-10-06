import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sap/hana-client', 'oracledb'],
};

export default nextConfig;
