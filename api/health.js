export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    version: process.env.npm_package_version ?? '1.0.0',
    timestamp: new Date().toISOString(),
    supabase: Boolean(process.env.VITE_SUPABASE_URL),
  })
}
