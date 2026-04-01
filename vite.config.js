import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()]
})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react-swc'

// export default defineConfig({
//   plugins: [react()],
//   base: "/ShaffersCodePage",
//   server: {
//     host: true, // permite conexiones desde IP externa (0.0.0.0)
//     strictPort: true,
//     port: 5173,
//     origin: 'http://localhost:5173', // evita problemas de CORS en algunos casos
//     hmr: {
//       clientPort: 443 // para que funcione bien el hot reload por HTTPS con ngrok
//     },
//     allowedHosts: [
//       'localhost',
//       '127.0.0.1',
//       'df78-186-39-139-85.ngrok-free.app' // tu host actual de ngrok
//     ]
//   }
// })
