import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // añadir url de confianza res.cloudinary.com
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com",
      },
    ],
  },
  
  // --- CONFIGURACIÓN AÑADIDA ---
  // Desactiva la verificación de ESLint durante la compilación
  eslint: {
    // Advertencia: Esto permite que las compilaciones de producción se completen
    // correctamente incluso si tu proyecto tiene errores de ESLint.
    ignoreDuringBuilds: true,
  },
  // -----------------------------

  /* otras opciones de configuración aquí */
};

export default nextConfig;
