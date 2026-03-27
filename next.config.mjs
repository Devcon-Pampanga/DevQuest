/** @type {import('next').NextConfig} */
const nextConfig = {
  // jsPDF v3 ships ESM exports without "type": "module", so webpack can't
  // resolve its browser bundle automatically. transpilePackages forces
  // Next.js to process it through SWC, fixing the dynamic import at runtime.
  transpilePackages: ["jspdf"],
};

export default nextConfig;
