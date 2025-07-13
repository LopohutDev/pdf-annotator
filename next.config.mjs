/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclude canvas from the server-side bundle
    if (isServer) {
      config.externals.push('canvas');
    }
    return config;
  },
};

export default nextConfig;
