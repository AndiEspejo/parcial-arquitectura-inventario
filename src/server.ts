import app from './app';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

app.listen(PORT, () => {
  console.log(`[server] Warehouse Inventory API running on port ${PORT}`);
  console.log(`[server] Swagger UI: http://localhost:${PORT}/api-docs`);
});
