/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    browserToTerminal: true,
  },
  async headers() {
    return [
      {
        // Lets popups this app opens (e.g. Google Sign-In) postMessage back
        // while still severing the implicit cross-origin coupling that
        // exists with no COOP header set. Required for the GSI callback to
        // fire reliably; also tightens security overall.
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
