import Fastify from 'fastify';
import cors from '@fastify/cors';
import { userRoutes } from './routes/userRoutes';

const app = Fastify({
  logger: true,
});

// Registrar CORS
app.register(cors, {
  origin: true, // Permitir solicitudes desde el frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});
app.get('/health', async () => {
  return { status: 'OK', 
            message: 'Servidor Backend Fastify activo',
            version: process.env.APP_VERSION ?? 'v1',
            service: 'backend'
           };
});

// Ruta raíz de verificación
app.get('/', async () => {
  return { status: 'OK', message: 'Servidor Backend Fastify activo' };
});

// Registrar Rutas
app.register(userRoutes);

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const start = async () => {
  try {
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor backend escuchando en http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
